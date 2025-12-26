import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { computeTaskStatus, toYmd } from "@/lib/tasks/format";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const scoped = await requireActiveCompany(req);

  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: { companyId: scoped.companyId, status: { not: "done" } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, category: true, title: true, dueDate: true, status: true },
  });

  const res = tasks.map((t) => ({
    taskId: t.id,
    category: t.category,
    title: t.title,
    dueDate: toYmd(t.dueDate),
    status: computeTaskStatus(t.status, t.dueDate, now),
  }));

  return jsonOk(res);
}
