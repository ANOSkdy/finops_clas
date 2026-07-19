import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import { assertSameOrigin } from "@/lib/api/origin";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { manualStatuses } from "@/lib/manual/procedures";

export const runtime = "nodejs";
const schema = z.object({ status: z.enum(manualStatuses) });

export async function PATCH(request: Request, { params }: { params: Promise<{ procedureId: string }> }) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    const { procedureId } = await params;
    const parsedId = z.object({ procedureId: z.uuid() }).safeParse({ procedureId });
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsedId.success) return validationError(parsedId.error);
    if (!parsed.success) return validationError(parsed.error);
    const procedure = await db.manualProcedure.findFirst({
      where: { id: procedureId, OR: [{ companyId: null }, { companyId: context.companyId }] },
      select: { id: true }
    });
    if (!procedure) throw new AppError("NOT_FOUND", "対象の手続きが見つかりません", 404);
    const [, saved] = await db.$transaction([
      db.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.session.userId,
          action: "manual-procedure.status",
          entityType: "ManualProcedure",
          entityId: procedureId,
          result: "success",
          metadata: { status: parsed.data.status }
        }
      }),
      db.companyManualProcedureStatus.upsert({
        where: { companyId_procedureId: { companyId: context.companyId, procedureId } },
        create: { companyId: context.companyId, procedureId, status: parsed.data.status, updatedByUserId: context.session.userId },
        update: { status: parsed.data.status, updatedByUserId: context.session.userId }
      })
    ]);
    return NextResponse.json({ status: saved.status });
  });
}
