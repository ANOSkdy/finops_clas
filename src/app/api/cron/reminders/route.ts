import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/api/response";
import { sendMail } from "@/lib/mail";
import { getReminderEmailKey } from "@/lib/tasks/reminderPolicy";
import type { ReminderEmailKey } from "@/lib/tasks/reminderPolicy";

export const runtime = "nodejs";

const REMIND_LABELS: Record<ReminderEmailKey, string> = {
  "30d_before": "30日前",
  "14d_before": "14日前",
  "7d_before": "7日前",
  "3d_before": "3日前",
  "1d_before": "前日",
  today: "本日期限",
  overdue: "期限切れ",
};

function formatDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const authorized =
    authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const today = new Date();
  const windowEnd = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 30)
  );

  const tasks = await prisma.task.findMany({
    where: {
      status: { not: "done" },
      dueDate: { lte: windowEnd },
    },
    include: {
      company: {
        select: { id: true, name: true, contactEmail: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 200,
  });

  let scanned = tasks.length;
  let eligible = 0;
  let queued = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const task of tasks) {
    const remindKey = getReminderEmailKey({
      dueDate: task.dueDate,
      today,
      taskKey: task.taskKey,
    });

    if (!remindKey) {
      skipped++;
      continue;
    }

    if (!task.company.contactEmail) {
      skipped++;
      continue;
    }

    eligible++;

    let deliveryId: string;
    try {
      const delivery = await prisma.taskReminderDelivery.create({
        data: {
          taskId: task.id,
          channel: "email",
          remindKey,
          status: "queued",
        },
        select: { id: true },
      });
      deliveryId = delivery.id;
      queued++;
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        skipped++;
        continue;
      }
      failed++;
      continue;
    }

    const dueDateStr = formatDateUTC(task.dueDate);
    const remindLabel = REMIND_LABELS[remindKey];
    const subject = `【CLAS FinOps】税務期限リマインド：${task.title}`;
    const body = [
      `${task.company.name} の税務スケジュールのリマインドです。`,
      "",
      `内容: ${task.title}`,
      `期限: ${dueDateStr}`,
      `通知: ${remindLabel}`,
      "",
      "アプリで詳細を確認してください。",
    ].join("\n");

    const sendResult = await sendMail({
      to: task.company.contactEmail,
      subject,
      body,
      attachments: [],
    });

    if (sendResult.status === "sent") {
      await prisma.taskReminderDelivery.update({
        where: { id: deliveryId },
        data: { status: "sent", sentAt: new Date(), error: null },
      });
      sent++;
    } else {
      await prisma.taskReminderDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
          error: sendResult.error.slice(0, 500),
          updatedAt: new Date(),
        },
      });
      failed++;
    }
  }

  return jsonOk({ ok: true, scanned, eligible, queued, sent, skipped, failed });
}
