import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/api/origin";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listManualProcedures, manualCategories } from "@/lib/manual/procedures";

export const runtime = "nodejs";

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().transform((value) => value || null);
const createSchema = z.object({
  category: z.enum(manualCategories),
  title: z.string().trim().min(1).max(300),
  trigger: z.string().trim().min(1).max(5_000),
  deadline: z.string().trim().min(1).max(2_000),
  submissionDestination: optionalText(2_000),
  cost: optionalText(2_000),
  notes: z.string().trim().max(10_000).optional().default("")
});

export async function GET() {
  return withApiError(async () => {
    const context = await requireActiveCompany();
    return NextResponse.json({ procedures: await listManualProcedures(context.companyId) });
  });
}

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    const parsed = createSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const id = randomUUID();
    const [procedure] = await db.$transaction([
      db.manualProcedure.create({
        data: {
          id,
          companyId: context.companyId,
          createdByUserId: context.session.userId,
          position: 1_000,
          ...parsed.data
        }
      }),
      db.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.session.userId,
          action: "manual-procedure.create",
          entityType: "ManualProcedure",
          entityId: id,
          result: "success"
        }
      })
    ]);
    return NextResponse.json({
      procedure: {
        id: procedure.id,
        category: procedure.category,
        title: procedure.title,
        trigger: procedure.trigger,
        deadline: procedure.deadline,
        submissionDestination: procedure.submissionDestination,
        cost: procedure.cost,
        notes: procedure.notes,
        status: "not_started",
        custom: true
      }
    }, { status: 201 });
  });
}
