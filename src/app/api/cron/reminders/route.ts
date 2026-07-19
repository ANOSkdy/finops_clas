import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import { jsonError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { addDays, fromDateUtc, todayInTokyo } from "@/lib/date/business-date";
import { equivalentReminderKeys, reminderKey } from "@/lib/tasks/reminder-policy";
import { MailProviderError, sendMail } from "@/lib/mail/provider";

export const runtime = "nodejs";
export const maxDuration = 60;
const querySchema = z.object({ dryRun: z.enum(["true", "false"]).optional(), cursor: z.uuid().optional() });
const STALE_CLAIM_MS = 15 * 60_000;
const MAX_DELIVERY_ATTEMPTS = 5;
const EXECUTION_BUDGET_MS = 45_000;
const RECOVERY_BATCH_SIZE = 20;

type Summary = { scanned: number; eligible: number; queued: number; sent: number; skipped: number; failed: number; recovered: number; resumeCursor: string | null };

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) throw new AppError("UNAUTHORIZED", "認証に失敗しました", 401);
}

function retryAt(now: Date, attempts: number) {
  return new Date(now.getTime() + Math.min(60 * 60_000, 60_000 * 2 ** Math.max(0, attempts - 1)));
}

async function deliver(delivery: { id: string; taskId: string; remindKey: string; attemptCount: number }, task: { status: string; title: string; dueDate: Date; company: { email: string | null } }, summary: Summary) {
  const now = new Date();
  if (task.status === "done") { summary.skipped += 1; return; }
  if (!task.company.email) {
    await db.taskReminderDelivery.updateMany({ where: { id: delivery.id, status: "queued" }, data: { status: "failed", errorCode: "MAIL_PERMANENT", nextAttemptAt: null } });
    summary.skipped += 1;
    return;
  }
  try {
    await sendMail({ to: task.company.email, subject: `【CLAS FinOps】${task.title}の期限のお知らせ`, body: `${task.title}\n期限: ${fromDateUtc(task.dueDate)}\n\nCLAS FinOpsで状況をご確認ください。`, attachments: [] });
    await db.taskReminderDelivery.updateMany({ where: { id: delivery.id, status: "queued" }, data: { status: "sent", sentAt: new Date(), errorCode: null, nextAttemptAt: null } });
    summary.sent += 1;
  } catch (error) {
    const providerError = error instanceof MailProviderError ? error : new MailProviderError("MAIL_TRANSIENT", 503);
    const terminal = providerError.code === "MAIL_PERMANENT" || delivery.attemptCount >= MAX_DELIVERY_ATTEMPTS;
    await db.taskReminderDelivery.updateMany({ where: { id: delivery.id, status: "queued" }, data: { status: "failed", errorCode: providerError.code, nextAttemptAt: terminal ? null : retryAt(now, delivery.attemptCount) } });
    console.info(JSON.stringify({ operation: "reminder_delivery", result: terminal ? "terminal_failure" : "scheduled_retry", code: providerError.code, attempts: delivery.attemptCount }));
    summary.failed += 1;
  }
}

async function claimExisting(id: string, status: string, attemptCount: number, staleBefore: Date) {
  if (attemptCount >= MAX_DELIVERY_ATTEMPTS) return false;
  const where = status === "queued"
    ? { id, status: "queued", updatedAt: { lt: staleBefore } }
    : { id, status: "failed", nextAttemptAt: { lte: new Date() } };
  const result = await db.taskReminderDelivery.updateMany({ where, data: { status: "queued", errorCode: null, nextAttemptAt: null, lastAttemptAt: new Date(), attemptCount: { increment: 1 } } });
  return result.count === 1;
}

async function claimCurrent(taskId: string, key: string, staleBefore: Date) {
  const existing = await db.taskReminderDelivery.findFirst({ where: { taskId, channel: "email", remindKey: { in: equivalentReminderKeys(key) } }, orderBy: { createdAt: "asc" } });
  if (existing) return { claimed: await claimExisting(existing.id, existing.status, existing.attemptCount, staleBefore), delivery: { ...existing, attemptCount: existing.attemptCount + 1 } };
  const created = await db.taskReminderDelivery.createMany({ data: [{ taskId, channel: "email", remindKey: key, status: "queued", attemptCount: 1, lastAttemptAt: new Date() }], skipDuplicates: true });
  if (!created.count) return { claimed: false, delivery: null };
  const delivery = await db.taskReminderDelivery.findUniqueOrThrow({ where: { taskId_channel_remindKey: { taskId, channel: "email", remindKey: key } } });
  return { claimed: true, delivery };
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }

function run(request: Request) {
  return withApiError(async () => {
    authorize(request);
    const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return jsonError(new AppError("VALIDATION_ERROR", "実行パラメータが正しくありません", 400));
    const dryRun = query.data.dryRun === "true";
    const startedAt = Date.now();
    const summary: Summary = { scanned: 0, eligible: 0, queued: 0, sent: 0, skipped: 0, failed: 0, recovered: 0, resumeCursor: null };
    const staleBefore = new Date(Date.now() - STALE_CLAIM_MS);

    // Recovery intentionally uses persisted keys, not today's policy, so missed dates are durable.
    const recoveries = await db.taskReminderDelivery.findMany({ where: { OR: [{ status: "failed", nextAttemptAt: { lte: new Date() } }, { status: "queued", updatedAt: { lt: staleBefore } }] }, include: { task: { include: { company: true } } }, orderBy: { updatedAt: "asc" }, take: RECOVERY_BATCH_SIZE });
    for (const item of recoveries) {
      if (Date.now() - startedAt > EXECUTION_BUDGET_MS) break;
      if (item.status === "queued") console.info(JSON.stringify({ operation: "reminder_stale_claim", result: "recovering" }));
      if (dryRun) { summary.queued += 1; continue; }
      if (!(await claimExisting(item.id, item.status, item.attemptCount, staleBefore))) { summary.skipped += 1; continue; }
      summary.queued += 1; summary.recovered += 1;
      await deliver({ ...item, attemptCount: item.attemptCount + 1 }, item.task, summary);
    }

    const today = todayInTokyo();
    const maxDue = addDays(today, 30);
    let cursor = query.data.cursor;
    do {
      const tasks = await db.task.findMany({ where: { status: { not: "done" }, dueDate: { lte: new Date(`${maxDue}T00:00:00Z`) } }, include: { company: true }, orderBy: { id: "asc" }, take: 100, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
      if (!tasks.length) break;
      for (const task of tasks) {
        if (Date.now() - startedAt > EXECUTION_BUDGET_MS) { summary.resumeCursor = task.id; break; }
        summary.scanned += 1;
        const key = reminderKey(task.taskKey, fromDateUtc(task.dueDate), today);
        if (!key || !task.company.email) { summary.skipped += 1; continue; }
        summary.eligible += 1;
        if (dryRun) { summary.queued += 1; continue; }
        const claim = await claimCurrent(task.id, key, staleBefore);
        if (!claim.claimed || !claim.delivery) { summary.skipped += 1; continue; }
        summary.queued += 1;
        await deliver(claim.delivery, task, summary);
      }
      if (summary.resumeCursor) break;
      cursor = tasks.at(-1)?.id;
      if (tasks.length < 100) break;
    } while (cursor);
    console.info(JSON.stringify({ operation: "reminder_batch", result: "completed", ...summary }));
    return NextResponse.json(summary);
  });
}
