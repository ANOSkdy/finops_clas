import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { canEditCompany } from "@/lib/auth/rbac";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateRecurringTaxDueDateSchema } from "@/lib/validators/recurringTaxDueDate";

export const runtime = "nodejs";

function canMutate(scoped: NonNullable<Awaited<ReturnType<typeof requireActiveCompany>>>) {
  return scoped.auth.user.role === "admin" || scoped.auth.user.role === "global" || canEditCompany(scoped.membership?.roleInCompany);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!canMutate(scoped)) return jsonError(403, "FORBIDDEN", "編集権限がありません");

  const parsed = updateRecurringTaxDueDateSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "入力値が不正です");

  const { id } = await params;
  const existing = await prisma.companyRecurringTaxDueDate.findFirst({ where: { id, companyId: scoped.companyId }, select: { id: true } });
  if (!existing) return jsonError(404, "NOT_FOUND", "対象データが見つかりません");

  const updated = await prisma.companyRecurringTaxDueDate.update({
    where: { id },
    data: { ...parsed.data.dueDate, installmentLabel: parsed.data.dueDate.installmentLabel ?? undefined },
    select: { id: true, taxType: true, title: true, installmentLabel: true, month: true, day: true, enabled: true, sortOrder: true },
  });

  return jsonOk({ dueDate: updated });
}

export const PUT = PATCH;

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!canMutate(scoped)) return jsonError(403, "FORBIDDEN", "編集権限がありません");

  const { id } = await params;
  const existing = await prisma.companyRecurringTaxDueDate.findFirst({ where: { id, companyId: scoped.companyId }, select: { id: true } });
  if (!existing) return jsonError(404, "NOT_FOUND", "対象データが見つかりません");

  await prisma.companyRecurringTaxDueDate.delete({ where: { id } });
  return jsonOk({ ok: true });
}
