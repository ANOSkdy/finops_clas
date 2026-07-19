import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { withApiError } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET() {
  return withApiError(async () => {
    const session = await requireAuth();
    return NextResponse.json({
      user: { id: session.user.id, name: session.user.name, loginId: session.user.loginId, role: session.user.role },
      activeCompany: session.activeCompany ? { id: session.activeCompany.id, name: session.activeCompany.name, legalForm: session.activeCompany.legalForm } : null
    });
  });
}
