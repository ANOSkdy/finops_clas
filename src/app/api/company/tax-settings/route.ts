import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { canEditCompany } from "@/lib/auth/rbac";
import { companyTaxSettingUpdateSchema } from "@/lib/validators/companyTaxSetting";

export const runtime = "nodejs";

function bigIntToStringOrNull(value: bigint | null | undefined): string | null {
  return value == null ? null : value.toString();
}

function moneyStringToBigIntOrNull(value: string | null | undefined): bigint | null {
  if (value == null || value === "") return null;
  return BigInt(value);
}

function serializeCompanyTaxSetting(setting: {
  previousCorporateTaxNationalAmountYen: bigint | null;
  isConsumptionTaxTaxableBusiness: boolean;
  consumptionTaxReason: string | null;
  previousConsumptionTaxNationalAmountYen: bigint | null;
}) {
  return {
    previousCorporateTaxNationalAmountYen: bigIntToStringOrNull(
      setting.previousCorporateTaxNationalAmountYen
    ),
    isConsumptionTaxTaxableBusiness: setting.isConsumptionTaxTaxableBusiness,
    consumptionTaxReason: setting.consumptionTaxReason,
    previousConsumptionTaxNationalAmountYen: bigIntToStringOrNull(
      setting.previousConsumptionTaxNationalAmountYen
    ),
  };
}

export async function GET(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  const setting = await prisma.companyTaxSetting.findUnique({
    where: { companyId: scoped.companyId },
  });

  return NextResponse.json(
    {
      taxSetting: setting
        ? serializeCompanyTaxSetting(setting)
        : {
            previousCorporateTaxNationalAmountYen: null,
            isConsumptionTaxTaxableBusiness: false,
            consumptionTaxReason: null,
            previousConsumptionTaxNationalAmountYen: null,
          },
    },
    { status: 200 }
  );
}

export async function PUT(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  const isSystemAdmin =
    scoped.auth.user.role === "admin" || scoped.auth.user.role === "global";
  if (!isSystemAdmin && !canEditCompany(scoped.membership.roleInCompany)) {
    return jsonError(403, "FORBIDDEN", "編集権限がありません");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = companyTaxSettingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { taxSetting } = parsed.data;
  const saved = await prisma.companyTaxSetting.upsert({
    where: { companyId: scoped.companyId },
    create: {
      companyId: scoped.companyId,
      previousCorporateTaxNationalAmountYen: moneyStringToBigIntOrNull(
        taxSetting.previousCorporateTaxNationalAmountYen
      ),
      isConsumptionTaxTaxableBusiness: taxSetting.isConsumptionTaxTaxableBusiness,
      consumptionTaxReason: taxSetting.consumptionTaxReason ?? null,
      previousConsumptionTaxNationalAmountYen: moneyStringToBigIntOrNull(
        taxSetting.previousConsumptionTaxNationalAmountYen
      ),
      updatedAt: new Date(),
    },
    update: {
      previousCorporateTaxNationalAmountYen: moneyStringToBigIntOrNull(
        taxSetting.previousCorporateTaxNationalAmountYen
      ),
      isConsumptionTaxTaxableBusiness: taxSetting.isConsumptionTaxTaxableBusiness,
      consumptionTaxReason: taxSetting.consumptionTaxReason ?? null,
      previousConsumptionTaxNationalAmountYen: moneyStringToBigIntOrNull(
        taxSetting.previousConsumptionTaxNationalAmountYen
      ),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ taxSetting: serializeCompanyTaxSetting(saved) }, { status: 200 });
}
