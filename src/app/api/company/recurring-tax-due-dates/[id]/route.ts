import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyEditor } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const recurringPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  taxType: z.string().trim().min(1).max(50).optional(),
  installmentLabel: z.string().trim().max(50).nullable().optional(),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),
  enabled: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, { message: "更新項目が必要です" });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireCompanyEditor();
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new AppError("NOT_FOUND", "納期限が見つかりません", 404);
    const parsed = recurringPatchSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const result = await db.$transaction(async (tx) => {
      const current = await tx.companyRecurringTaxDueDate.findFirst({ where: { id, companyId: context.companyId } });
      if (!current) throw new AppError("NOT_FOUND", "納期限が見つかりません", 404);
      const month = parsed.data.month ?? current.month;
      const day = parsed.data.day ?? current.day;
      const probe = new Date(Date.UTC(2024, month - 1, day));
      if (probe.getUTCMonth() !== month - 1) throw new AppError("VALIDATION_ERROR", "存在しない日付です", 400);
      await tx.companyRecurringTaxDueDate.update({ where: { id }, data: parsed.data });
      await tx.company.update({ where: { id: context.companyId }, data: { scheduleDirtyAt: new Date() } });
      await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "recurring-tax-due-date.update", entityType: "CompanyRecurringTaxDueDate", entityId: id, result: "success" } });
      return tx.companyRecurringTaxDueDate.findUniqueOrThrow({ where: { id } });
    });
    return NextResponse.json({ dueDate: result, scheduleRefreshRequired: true });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireCompanyEditor();
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new AppError("NOT_FOUND", "納期限が見つかりません", 404);
    const deleted = await db.$transaction(async (tx) => {
      const result = await tx.companyRecurringTaxDueDate.deleteMany({ where: { id, companyId: context.companyId } });
      if (result.count !== 1) throw new AppError("NOT_FOUND", "納期限が見つかりません", 404);
      await tx.company.update({ where: { id: context.companyId }, data: { scheduleDirtyAt: new Date() } });
      await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "recurring-tax-due-date.delete", entityType: "CompanyRecurringTaxDueDate", entityId: id, result: "success" } });
      return result.count;
    });
    return NextResponse.json({ ok: deleted === 1, scheduleRefreshRequired: true });
  });
}
