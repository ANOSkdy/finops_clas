import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import { jsonError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { addDays, fromDateUtc, todayInTokyo } from "@/lib/date/business-date";
import { reminderKey } from "@/lib/tasks/reminder-policy";
import { sendMail } from "@/lib/mail/provider";

export const runtime = "nodejs";
export const maxDuration = 60;
const querySchema = z.object({ dryRun: z.enum(["true", "false"]).optional(), cursor: z.uuid().optional() });

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) throw new AppError("UNAUTHORIZED", "認証に失敗しました", 401);
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

function run(request: Request) {
  return withApiError(async () => {
    authorize(request);
    const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return jsonError(new AppError("VALIDATION_ERROR", "実行パラメータが正しくありません", 400));
    const today = todayInTokyo();
    const maxDue = addDays(today, 30);
    const startedAt = Date.now();
    const summary = { scanned: 0, eligible: 0, queued: 0, sent: 0, skipped: 0, failed: 0, resumeCursor: null as string | null };
    let cursor = query.data.cursor;
    do {
      const tasks = await db.task.findMany({
        where: { status: { not: "done" }, dueDate: { lte: new Date(`${maxDue}T00:00:00Z`) } },
        include: { company: true },
        orderBy: { id: "asc" },
        take: 100,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
      });
      if (tasks.length === 0) break;
      for (const task of tasks) {
        summary.scanned += 1;
        const key = reminderKey(task.taskKey, fromDateUtc(task.dueDate), today);
        if (!key || !task.company.email) { summary.skipped += 1; continue; }
        summary.eligible += 1;
        if (query.data.dryRun === "true") { summary.queued += 1; continue; }
        const existing = await db.taskReminderDelivery.findUnique({ where: { taskId_channel_remindKey: { taskId: task.id, channel: "email", remindKey: key } } });
        const staleBefore = new Date(Date.now() - 15 * 60_000);
        const retryable = existing?.status === "failed" || (existing?.status === "queued" && existing.updatedAt < staleBefore);
        const claimed = retryable && existing
          ? await db.taskReminderDelivery.updateMany({ where: { id: existing.id, status: existing.status, ...(existing.status === "queued" ? { updatedAt: { lt: staleBefore } } : {}) }, data: { status: "queued", errorCode: null } })
          : existing
            ? { count: 0 }
            : await db.taskReminderDelivery.createMany({ data: [{ taskId: task.id, channel: "email", remindKey: key, status: "queued" }], skipDuplicates: true });
        if (claimed.count === 0) { summary.skipped += 1; continue; }
        summary.queued += 1;
        try {
          await sendMail({ to: task.company.email, subject: `【CLAS FinOps】${task.title}の期限のお知らせ`, body: `${task.title}\n期限: ${fromDateUtc(task.dueDate)}\n\nCLAS FinOpsで状況をご確認ください。`, attachments: [] });
          await db.taskReminderDelivery.update({ where: { taskId_channel_remindKey: { taskId: task.id, channel: "email", remindKey: key } }, data: { status: "sent", sentAt: new Date() } });
          summary.sent += 1;
        } catch (error) {
          const code = error instanceof AppError ? error.code : "MAIL_ERROR";
          await db.taskReminderDelivery.update({ where: { taskId_channel_remindKey: { taskId: task.id, channel: "email", remindKey: key } }, data: { status: "failed", errorCode: code } });
          summary.failed += 1;
        }
      }
      cursor = tasks.at(-1)?.id;
      if (Date.now() - startedAt > 45_000) { summary.resumeCursor = cursor ?? null; break; }
      if (tasks.length < 100) break;
    } while (cursor);
    console.info(JSON.stringify({ operation: "reminder_batch", result: "completed", ...summary }));
    return NextResponse.json(summary);
  });
}
