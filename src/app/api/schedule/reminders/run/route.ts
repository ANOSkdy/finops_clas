import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getMailProviderName, sendMail } from "@/lib/mail";
import {
  buildReminderBody,
  buildReminderSubject,
  reminderTargetDates,
  toYmd,
} from "@/lib/tasks/reminders";

export const runtime = "nodejs";

type CompanySummary = {
  id: string;
  name: string;
  contactEmail: string | null;
};

function authorizeCron(req: NextRequest) {
  const secret = process.env.REMINDER_CRON_SECRET;
  if (!secret) return false;

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === secret;
}

async function resolveNotificationTarget(company: CompanySummary) {
  const envAddress = process.env.REMINDER_TO_EMAIL?.trim();
  if (envAddress) return envAddress;
  return company.contactEmail?.trim() || null;
}

export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) {
    return jsonError(401, "UNAUTHORIZED", "cron実行キーが不正です");
  }

  const provider = getMailProviderName();
  if (provider === "disabled") {
    return jsonError(503, "MAIL_ERROR", "MAIL_PROVIDER=disabled のため送信できません");
  }

  const companyIds = req.nextUrl.searchParams.get("companyId")?.split(",").filter(Boolean) ?? [];

  const companies = await prisma.company.findMany({
    where: companyIds.length ? { id: { in: companyIds } } : undefined,
    select: { id: true, name: true, contactEmail: true },
    orderBy: { createdAt: "asc" },
  });

  const targets = reminderTargetDates();

  let sentCount = 0;
  let skippedCount = 0;
  const failures: Array<{ companyId: string; reason: string }> = [];

  for (const company of companies) {
    const mailTo = await resolveNotificationTarget(company);
    if (!mailTo) {
      skippedCount += 1;
      failures.push({ companyId: company.id, reason: "contact_email_missing" });
      continue;
    }

    const actor = await prisma.membership.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" },
      select: { userId: true },
    });

    if (!actor) {
      skippedCount += 1;
      failures.push({ companyId: company.id, reason: "membership_missing" });
      continue;
    }

    for (const target of targets) {
      const tasks = await prisma.task.findMany({
        where: {
          companyId: company.id,
          status: "pending",
          dueDate: target.dueDate,
        },
        select: { id: true, title: true, category: true, dueDate: true },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      });

      if (tasks.length === 0) continue;

      const alreadySentCount = await prisma.taskReminderLog.count({
        where: {
          taskId: { in: tasks.map((task) => task.id) },
          remindDaysBefore: target.daysBefore,
          dueDateSnapshot: target.dueDate,
          mailTo,
        },
      });

      if (alreadySentCount === tasks.length) {
        skippedCount += tasks.length;
        continue;
      }

      const dueDateYmd = toYmd(target.dueDate);
      const subject = buildReminderSubject(target.daysBefore);
      const body = buildReminderBody({
        companyName: company.name,
        daysBefore: target.daysBefore,
        dueDateYmd,
        tasks: tasks.map((task) => ({ title: task.title, category: task.category })),
      });

      const emailRow = await prisma.email.create({
        data: {
          companyId: company.id,
          userId: actor.userId,
          mailTo,
          subject,
          body,
          status: "queued",
        },
        select: { id: true },
      });

      const sendRes = await sendMail({
        to: mailTo,
        subject,
        body,
        attachments: [],
      });

      if (sendRes.status === "sent") {
        await prisma.$transaction([
          prisma.email.update({
            where: { id: emailRow.id },
            data: {
              status: "sent",
              providerMessageId: sendRes.providerMessageId,
              error: null,
            },
          }),
          ...tasks.map((task) =>
            prisma.taskReminderLog.upsert({
              where: {
                taskId_remindDaysBefore_dueDateSnapshot_mailTo: {
                  taskId: task.id,
                  remindDaysBefore: target.daysBefore,
                  dueDateSnapshot: target.dueDate,
                  mailTo,
                },
              },
              create: {
                companyId: company.id,
                taskId: task.id,
                remindDaysBefore: target.daysBefore,
                dueDateSnapshot: target.dueDate,
                mailTo,
                emailId: emailRow.id,
              },
              update: {
                emailId: emailRow.id,
              },
            })
          ),
        ]);
        sentCount += tasks.length;
      } else {
        await prisma.email.update({
          where: { id: emailRow.id },
          data: {
            status: "failed",
            providerMessageId: null,
            error: `provider=${provider}; ${sendRes.error}`.slice(0, 500),
          },
        });

        failures.push({
          companyId: company.id,
          reason: `send_failed:${sendRes.error}`,
        });
      }
    }
  }

  return jsonOk({
    ok: true,
    provider,
    sentCount,
    skippedCount,
    failures,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
