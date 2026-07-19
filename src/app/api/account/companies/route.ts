import { NextResponse } from "next/server";
import { requireGlobal } from "@/lib/auth/session";
import { withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return withApiError(async () => {
    await requireGlobal();
    return NextResponse.json({ companies: await db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) });
  });
}
