import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ itemId: z.uuid(), fiscalYear: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12), checked: z.boolean() });

export async function PATCH(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const item = await db.accountingChecklistItem.findFirst({ where: { id: parsed.data.itemId, companyId: context.companyId } });
    if (!item) throw new AppError("NOT_FOUND", "チェック項目が見つかりません", 404);
    const check = await db.accountingChecklistCheck.upsert({
      where: { companyId_itemId_fiscalYear_month: { companyId: context.companyId, itemId: item.id, fiscalYear: parsed.data.fiscalYear, month: parsed.data.month } },
      create: { companyId: context.companyId, itemId: item.id, fiscalYear: parsed.data.fiscalYear, month: parsed.data.month, checked: parsed.data.checked },
      update: { checked: parsed.data.checked }
    });
    return NextResponse.json({ check });
  });
}
