import { NextResponse } from "next/server";
import { requireActiveCompany } from "@/lib/auth/session";
import { withApiError } from "@/lib/api/response";
import { getHomeSummary } from "@/lib/home/summary";

export const runtime = "nodejs";

export async function GET() {
  return withApiError(async () => {
    const context = await requireActiveCompany();
    return NextResponse.json(await getHomeSummary(context.companyId));
  });
}
