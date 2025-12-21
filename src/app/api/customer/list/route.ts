import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/tenant";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");

  const memberships = await prisma.membership.findMany({
    where: { userId: auth.user.id },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  const res = memberships.map((m) => ({
    companyId: m.company.id,
    name: m.company.name,
    representativeName: m.company.representativeName ?? null,
    contactEmail: m.company.contactEmail ?? null,
    contactPhone: m.company.contactPhone ?? null,
    legalForm: m.company.legalForm,
  }));

  return NextResponse.json(res, { status: 200 });
}