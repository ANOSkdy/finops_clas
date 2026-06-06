import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { canEditCompany } from "@/lib/auth/rbac";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAccountingChecklistItemSchema } from "@/lib/validators/accountingChecklist";

export const runtime = "nodejs";

function canMutate(scoped: NonNullable<Awaited<ReturnType<typeof requireActiveCompany>>>) {
  return scoped.auth.user.role === "admin" || scoped.auth.user.role === "global" || canEditCompany(scoped.membership?.roleInCompany);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function POST(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!canMutate(scoped)) return jsonError(403, "FORBIDDEN", "編集権限がありません");

  const parsed = createAccountingChecklistItemSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "入力値が不正です");

  const maxSort = await prisma.accountingChecklistItem.aggregate({
    where: { companyId: scoped.companyId },
    _max: { sortOrder: true },
  });

  try {
    const item = await prisma.accountingChecklistItem.create({
      data: {
        companyId: scoped.companyId,
        name: parsed.data.name,
        isDefault: false,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
      select: { id: true, name: true, isDefault: true, sortOrder: true },
    });
    return jsonOk({ item }, 201);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return jsonError(409, "CONFLICT", "同じ名前の項目が既にあります");
    }
    throw error;
  }
}
