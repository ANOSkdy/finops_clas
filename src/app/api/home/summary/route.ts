import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { computeTaskStatus, startOfTodayUtc, toYmd } from "@/lib/tasks/format";
import { createEmptyReminderGroups, getReminderGroupKey } from "@/lib/tasks/reminderPolicy";

export const runtime = "nodejs";

const GROUP_LIMIT = 8;

type ReminderTask = {
  taskId: string;
  title: string;
  dueDate: string;
  status: "pending" | "done" | "overdue";
  taskKey?: string | null;
  category?: "tax" | "social" | "other";
};

export async function GET(req: NextRequest) {
  const scoped = await requireActiveCompany(req);

  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  const now = new Date();
  const today = startOfTodayUtc(now);
  const within30 = new Date(today);
  within30.setUTCDate(within30.getUTCDate() + 30);

  const candidateTasks = await prisma.task.findMany({
    where: {
      companyId: scoped.companyId,
      status: { not: "done" },
      dueDate: { lte: within30 },
    },
    orderBy: [{ dueDate: "asc" }],
    select: { id: true, title: true, dueDate: true, status: true, taskKey: true, category: true },
  });

  const reminderGroups = createEmptyReminderGroups<ReminderTask>();
  let overdueCount = 0;
  let dueTodayCount = 0;
  let within30Count = 0;

  for (const t of candidateTasks) {
    const displayStatus = computeTaskStatus(t.status, t.dueDate, now);
    const groupKey = getReminderGroupKey(t.dueDate, today);
    if (!groupKey) continue;

    within30Count += 1;
    if (groupKey === "overdue") overdueCount += 1;
    if (groupKey === "today") dueTodayCount += 1;

    if (reminderGroups[groupKey].length >= GROUP_LIMIT) continue;

    reminderGroups[groupKey].push({
      taskId: t.id,
      title: t.title,
      dueDate: toYmd(t.dueDate),
      status: displayStatus,
      taskKey: t.taskKey,
      category: t.category as "tax" | "social" | "other",
    });
  }

  const upcomingTasks = [
    ...reminderGroups.today,
    ...reminderGroups.within3Days,
    ...reminderGroups.within7Days,
    ...reminderGroups.within14Days,
  ].slice(0, 5);

  const alerts: Array<{ type: "warning"; message: string }> = [];
  if (overdueCount > 0) alerts.push({ type: "warning", message: `期限切れのタスクが ${overdueCount} 件あります` });
  if (dueTodayCount > 0) alerts.push({ type: "warning", message: `本日期限のタスクが ${dueTodayCount} 件あります` });
  if (within30Count > 0) alerts.push({ type: "warning", message: `30日以内のタスクが ${within30Count} 件あります` });
  if (alerts.length === 0) alerts.push({ type: "warning", message: "期限が近いタスクはありません" });

  return jsonOk({ alerts, upcomingTasks, reminderGroups });
}
