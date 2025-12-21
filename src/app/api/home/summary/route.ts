import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { computeTaskStatus, startOfTodayUtc, toYmd } from "@/lib/tasks/format";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const scoped = await requireActiveCompany(req);

  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  const now = new Date();
  const today = startOfTodayUtc(now);
  const soon = new Date(today);
  soon.setUTCDate(soon.getUTCDate() + 14);

  const overdueCount = await prisma.task.count({
    where: {
      companyId: scoped.companyId,
      status: { not: "done" },
      dueDate: { lt: today },
    },
  });

  const upcomingRaw = await prisma.task.findMany({
    where: {
      companyId: scoped.companyId,
      status: { not: "done" },
      dueDate: { gte: today, lte: soon },
    },
    orderBy: [{ dueDate: "asc" }],
    take: 5,
    select: { id: true, title: true, dueDate: true, status: true },
  });

  const upcomingTasks = upcomingRaw.map((t) => ({
    taskId: t.id,
    title: t.title,
    dueDate: toYmd(t.dueDate),
    status: computeTaskStatus(t.status, t.dueDate, now),
  }));

  const upcomingCount = await prisma.task.count({
    where: {
      companyId: scoped.companyId,
      status: { not: "done" },
      dueDate: { gte: today, lte: soon },
    },
  });

  const alerts: Array<{ type: "warning"; message: string }> = [];
  if (overdueCount > 0) alerts.push({ type: "warning", message: `期限切れのタスクが ${overdueCount} 件あります` });
  if (upcomingCount > 0) alerts.push({ type: "warning", message: `期限が近いタスクが ${upcomingCount} 件あります` });
  if (alerts.length === 0) alerts.push({ type: "warning", message: "期限が近いタスクはありません" });

  return jsonOk({ alerts, upcomingTasks });
}