import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany, requireCompanyEditor } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const recurringSchema = z.object({ title: z.string().trim().min(1).max(200), taxType: z.string().trim().min(1).max(50), installmentLabel: z.string().trim().max(50).nullable(), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31), enabled: z.boolean().default(true) }).superRefine((value, context) => {
  const probe = new Date(Date.UTC(2024, value.month - 1, value.day));
  if (probe.getUTCMonth() !== value.month - 1) context.addIssue({ code: "custom", path: ["day"], message: "存在しない日付です" });
});

export async function GET() {
  return withApiError(async () => {
    const context = await requireActiveCompany();
    return NextResponse.json({ dueDates: await db.companyRecurringTaxDueDate.findMany({ where: { companyId: context.companyId }, orderBy: [{ month: "asc" }, { day: "asc" }] }) });
  });
}

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireCompanyEditor();
    const parsed = recurringSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const dueDate = await db.$transaction(async (tx) => {
      const created = await tx.companyRecurringTaxDueDate.create({ data: { companyId: context.companyId, ...parsed.data } });
      await tx.company.update({ where: { id: context.companyId }, data: { scheduleDirtyAt: new Date() } });
      await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "recurring-tax-due-date.create", entityType: "CompanyRecurringTaxDueDate", entityId: created.id, result: "success" } });
      return created;
    });
    return NextResponse.json({ dueDate, scheduleRefreshRequired: true }, { status: 201 });
  });
}
