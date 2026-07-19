import { NextResponse } from "next/server";
import { requireActiveCompany } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { withApiError } from "@/lib/api/response";
import { syncGeneratedTasks } from "@/lib/tasks/sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    const result = await syncGeneratedTasks(context.companyId, context.session.userId);
    return NextResponse.json({ ok: true, ...result });
  });
}
