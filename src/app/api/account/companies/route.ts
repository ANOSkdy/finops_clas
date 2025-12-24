import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/tenant";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (auth.user.role !== "global") return jsonError(403, "FORBIDDEN", "権限がありません");

  const companies = await prisma.company.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
    },
  });

  return NextResponse.json(companies, { status: 200 });
}
