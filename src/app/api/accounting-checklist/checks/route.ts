import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { jsonError, jsonOk } from "@/lib/api/response";
import { upsertAccountingChecklistCheckSchema } from "@/lib/validators/accountingChecklist";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");

  const parsed = upsertAccountingChecklistCheckSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "入力値が不正です");

  const { itemId, fiscalYear, month, checked } = parsed.data;
  const item = await prisma.accountingChecklistItem.findFirst({
    where: { id: itemId, companyId: scoped.companyId },
    select: { id: true },
  });
  if (!item) return jsonError(404, "NOT_FOUND", "チェック項目が見つかりません");

  const check = await prisma.accountingChecklistCheck.upsert({
    where: { companyId_itemId_fiscalYear_month: { companyId: scoped.companyId, itemId, fiscalYear, month } },
    create: { companyId: scoped.companyId, itemId, fiscalYear, month, checked },
    update: { checked, updatedAt: new Date() },
    select: { itemId: true, fiscalYear: true, month: true, checked: true },
  });

  return jsonOk({ check });
}

export const POST = PATCH;
