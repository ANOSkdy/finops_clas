import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAccountingChecklistItemSchema } from "@/lib/validators/accountingChecklist";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力値が不正です");
  }

  const parsed = createAccountingChecklistItemSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "入力値が不正です");

  const maxSort = await prisma.accountingChecklistItem.aggregate({
    where: { companyId: scoped.companyId },
    _max: { sortOrder: true },
  });

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
}
