import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { canEditCompany } from "@/lib/auth/rbac";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createRecurringTaxDueDateSchema } from "@/lib/validators/recurringTaxDueDate";

export const runtime = "nodejs";

function canMutate(scoped: NonNullable<Awaited<ReturnType<typeof requireActiveCompany>>>) {
  return scoped.auth.user.role === "admin" || scoped.auth.user.role === "global" || canEditCompany(scoped.membership?.roleInCompany);
}

export async function GET(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");

  const dueDates = await prisma.companyRecurringTaxDueDate.findMany({
    where: { companyId: scoped.companyId },
    orderBy: [
      { taxType: "asc" },
      { sortOrder: "asc" },
      { month: "asc" },
      { day: "asc" },
      { createdAt: "asc" },
    ],
    select: { id: true, taxType: true, title: true, installmentLabel: true, month: true, day: true, enabled: true, sortOrder: true },
  });

  return jsonOk({ dueDates });
}

export async function POST(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!canMutate(scoped)) return jsonError(403, "FORBIDDEN", "編集権限がありません");

  const parsed = createRecurringTaxDueDateSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "入力値が不正です");

  const { dueDate } = parsed.data;
  const created = await prisma.companyRecurringTaxDueDate.create({
    data: { ...dueDate, installmentLabel: dueDate.installmentLabel ?? null, companyId: scoped.companyId },
    select: { id: true, taxType: true, title: true, installmentLabel: true, month: true, day: true, enabled: true, sortOrder: true },
  });

  return jsonOk({ dueDate: created });
}
