import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/tenant";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (auth.user.role !== "admin") return jsonError(403, "FORBIDDEN", "権限がありません");

  const users = await prisma.user.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      loginId: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(users, { status: 200 });
}
