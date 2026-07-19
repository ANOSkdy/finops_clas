import { NextResponse } from "next/server";
import { requireGlobal } from "@/lib/auth/session";
import { withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return withApiError(async () => {
    await requireGlobal();
    const users = await db.user.findMany({ select: { id: true, loginId: true, name: true, role: true, createdAt: true, _count: { select: { memberships: true, uploads: true, emails: true } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ users });
  });
}
