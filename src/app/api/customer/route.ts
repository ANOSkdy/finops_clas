import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany, requireCompanyEditor } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const updateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  closingMonth: z.number().int().min(1).max(12),
  representativeName: z.string().trim().max(100).nullable(),
  email: z.union([z.email().max(254), z.literal("")]).nullable(),
  phone: z.string().trim().max(30).nullable(),
  postalCode: z.string().trim().max(12).nullable(),
  address: z.string().trim().max(500).nullable(),
  corporateNumber: z.union([z.string().regex(/^\d{13}$/), z.literal("")]).nullable()
});

export async function GET() {
  return withApiError(async () => {
    const context = await requireActiveCompany();
    const record = await db.company.findUniqueOrThrow({
      where: { id: context.companyId },
      include: { taxSetting: true, recurringTaxDueDates: { orderBy: [{ month: "asc" }, { day: "asc" }] } }
    });
    const { taxSetting, recurringTaxDueDates, ...company } = record;
    const setting = taxSetting ? {
      ...taxSetting,
      previousCorporateTaxYen: taxSetting.previousCorporateTaxYen?.toString() ?? null,
      previousConsumptionTaxYen: taxSetting.previousConsumptionTaxYen?.toString() ?? null
    } : {
      isTaxable: false,
      withholdingSpecial: false,
      residentTaxSpecial: false,
      previousCorporateTaxYen: null,
      previousConsumptionTaxYen: null
    };
    const canEdit = context.session.user.role === "global" || context.session.user.role === "admin" || context.membership.roleInCompany === "admin";
    return NextResponse.json({ company, setting, dueDates: recurringTaxDueDates, roleInCompany: context.membership.roleInCompany, userRole: context.session.user.role, canEdit });
  });
}

export async function PUT(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireCompanyEditor();
    const parsed = updateSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const company = await db.$transaction(async (tx) => {
      const current = await tx.company.findUniqueOrThrow({ where: { id: context.companyId } });
      const updated = await tx.company.update({
        where: { id: context.companyId },
        data: {
          ...parsed.data,
          closingMonth: current.legalForm === "sole_proprietor" ? 12 : parsed.data.closingMonth,
          email: parsed.data.email || null,
          corporateNumber: parsed.data.corporateNumber || null,
          scheduleDirtyAt: new Date()
        }
      });
      await tx.auditLog.create({ data: { companyId: updated.id, actorUserId: context.session.userId, action: "company.update", entityType: "Company", entityId: updated.id, result: "success" } });
      return updated;
    });
    return NextResponse.json({ company });
  });
}
