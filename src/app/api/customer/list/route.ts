import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { withApiError } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET() {
  return withApiError(async () => {
    const session = await requireAuth();
    const memberships = [...session.user.memberships].sort((a, b) => a.company.name.localeCompare(b.company.name, "ja"));
    return NextResponse.json({
      companies: memberships.map(({ company, roleInCompany }) => ({
        id: company.id,
        name: company.name,
        legalForm: company.legalForm,
        representativeName: company.representativeName,
        email: company.email,
        roleInCompany,
        active: company.id === session.activeCompanyId
      }))
    });
  });
}
