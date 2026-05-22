import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["pending", "done"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [{ field: "body", reason: "invalid_json" }]);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({ field: i.path.join(".") || "body", reason: i.code }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { taskId } = await params;
  const existing = await prisma.task.findFirst({
    where: { id: taskId, companyId: scoped.companyId },
    select: { id: true },
  });

  if (!existing) return jsonError(404, "NOT_FOUND", "タスクが見つかりません");

  const updated = await prisma.task.update({
    where: { id: existing.id },
    data: { status: parsed.data.status, updatedAt: new Date() },
    select: { id: true, status: true },
  });

  return jsonOk({ task: { taskId: updated.id, status: updated.status } });
}
