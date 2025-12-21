import { NextRequest, NextResponse } from "next/server";
import {
  deleteDbSessionByToken,
  readSessionToken,
  SESSION_COOKIE_NAMES,
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = readSessionToken(req);
  if (token) {
    try {
      await deleteDbSessionByToken(token);
    } catch {
      // best-effort
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  const res = new NextResponse(null, { status: 204 });

  for (const name of SESSION_COOKIE_NAMES) {
    res.cookies.set({
      name,
      value: "",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}