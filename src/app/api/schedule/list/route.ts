import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { validationError, withApiError } from "@/lib/api/response";
import { asDateOnly, type DateOnly } from "@/lib/date/business-date";
import { getScheduleData } from "@/lib/tasks/list";

export const runtime = "nodejs";
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { try { asDateOnly(value); return true; } catch { return false; } });
const querySchema = z.object({
  category: z.enum(["tax", "labor", "other"]).optional(),
  status: z.enum(["pending", "overdue", "done"]).optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional()
}).refine((value) => !value.from || !value.to || value.from <= value.to, { path: ["to"], message: "終了日は開始日以降にしてください" });

export async function GET(request: Request) {
  return withApiError(async () => {
    const context = await requireActiveCompany();
    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return validationError(parsed.error);
    const query = parsed.data;
    return NextResponse.json(await getScheduleData(context.companyId, {
      ...query,
      from: query.from as DateOnly | undefined,
      to: query.to as DateOnly | undefined
    }));
  });
}
