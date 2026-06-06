import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accountingChecklistFiscalYearSchema } from "@/lib/validators/accountingChecklist";

export const runtime = "nodejs";

const DEFAULT_ITEMS = ["領収書", "通帳", "売上資料", "請求書", "クレジットカード明細"] as const;

function currentFiscalYear() {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  return month >= 4 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

async function ensureDefaultItems(companyId: string) {
  const existingItems = await prisma.accountingChecklistItem.findMany({
    where: { companyId, name: { in: [...DEFAULT_ITEMS] } },
    select: { name: true },
  });
  const existingNames = new Set(existingItems.map((item: { name: string }) => item.name));
  const missingItems = DEFAULT_ITEMS.flatMap((name, index) =>
    existingNames.has(name) ? [] : [{ companyId, name, isDefault: true, sortOrder: index }]
  );

  if (missingItems.length > 0) {
    await prisma.accountingChecklistItem.createMany({ data: missingItems });
  }
}

export async function GET(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");

  const fiscalYearParam = req.nextUrl.searchParams.get("fiscalYear");
  const fiscalYearResult = fiscalYearParam
    ? accountingChecklistFiscalYearSchema.safeParse(Number(fiscalYearParam))
    : { success: true as const, data: currentFiscalYear() };
  if (!fiscalYearResult.success) return jsonError(400, "VALIDATION_ERROR", "fiscalYear が不正です");

  await ensureDefaultItems(scoped.companyId);

  const [items, checks] = await Promise.all([
    prisma.accountingChecklistItem.findMany({
      where: { companyId: scoped.companyId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, isDefault: true, sortOrder: true },
    }),
    prisma.accountingChecklistCheck.findMany({
      where: { companyId: scoped.companyId, fiscalYear: fiscalYearResult.data },
      select: { itemId: true, month: true, checked: true },
    }),
  ]);

  return jsonOk({ fiscalYear: fiscalYearResult.data, items, checks });
}
