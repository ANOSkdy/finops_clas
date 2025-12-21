import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { loginRequestSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/auth/password";
import {
  createDbSession,
  SESSION_COOKIE_NAME_TO_SET,
  SESSION_COOKIE_NAMES,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { loginId, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { loginId } });
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!ok) return jsonError(401, "UNAUTHORIZED", "IDまたはパスワードが違います");

  const { token } = await createDbSession(user!.id);

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

  res.cookies.set({
    name: SESSION_COOKIE_NAME_TO_SET,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return res;
}
