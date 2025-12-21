import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = await getSession(req);
  if (!s) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  return new NextResponse(null, { status: 204 });
}