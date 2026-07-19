import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany, requireCompanyEditor } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { moneyStringSchema } from "@/lib/validators/common";

export const runtime = "nodejs";
const schema = z.object({
  isTaxable: z.boolean(),
  withholdingSpecial: z.boolean(),
  residentTaxSpecial: z.boolean(),
  previousCorporateTaxYen: moneyStringSchema.nullable(),
  previousConsumptionTaxYen: moneyStringSchema.nullable()
});

function serialize<T extends { previousCorporateTaxYen: bigint | null; previousConsumptionTaxYen: bigint | null }>(value: T) {
  return { ...value, previousCorporateTaxYen: value.previousCorporateTaxYen?.toString() ?? null, previousConsumptionTaxYen: value.previousConsumptionTaxYen?.toString() ?? null };
}

export async function GET() {
  return withApiError(async () => {
    const context = await requireActiveCompany();
    const setting = await db.companyTaxSetting.findUnique({ where: { companyId: context.companyId } });
    return NextResponse.json({ setting: setting ? serialize(setting) : { isTaxable: false, withholdingSpecial: false, residentTaxSpecial: false, previousCorporateTaxYen: null, previousConsumptionTaxYen: null } });
  });
}

export async function PUT(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireCompanyEditor();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const values = { ...parsed.data, previousCorporateTaxYen: parsed.data.previousCorporateTaxYen ? BigInt(parsed.data.previousCorporateTaxYen) : null, previousConsumptionTaxYen: parsed.data.previousConsumptionTaxYen ? BigInt(parsed.data.previousConsumptionTaxYen) : null };
    const setting = await db.$transaction(async (tx) => {
      const saved = await tx.companyTaxSetting.upsert({ where: { companyId: context.companyId }, create: { companyId: context.companyId, ...values }, update: values });
      await tx.company.update({ where: { id: context.companyId }, data: { scheduleDirtyAt: new Date() } });
      await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "tax-settings.update", entityType: "CompanyTaxSetting", entityId: context.companyId, result: "success" } });
      return saved;
    });
    return NextResponse.json({ setting: serialize(setting), scheduleRefreshRequired: true });
  });
}
