import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { AppError } from "@/lib/api/errors";
import { withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { fiscalYearInTokyo } from "@/lib/date/business-date";

export const runtime = "nodejs";
const defaults = ["領収書", "通帳", "売上資料", "請求書", "クレジットカード明細"];

export async function GET(request: Request) {
  return withApiError(async () => {
    const context = await requireActiveCompany();
    const raw = new URL(request.url).searchParams.get("fiscalYear") ?? String(fiscalYearInTokyo());
    const parsed = z.coerce.number().int().min(2000).max(2100).safeParse(raw);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "年度は2000〜2100で指定してください", 400);
    await db.accountingChecklistItem.createMany({
      data: defaults.map((name, position) => ({ companyId: context.companyId, name, position })),
      skipDuplicates: true
    });
    const [items, checks] = await Promise.all([
      db.accountingChecklistItem.findMany({ where: { companyId: context.companyId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
      db.accountingChecklistCheck.findMany({ where: { companyId: context.companyId, fiscalYear: parsed.data } })
    ]);
    return NextResponse.json({ fiscalYear: parsed.data, items, checks });
  });
}
