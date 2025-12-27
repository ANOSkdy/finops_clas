import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { changePasswordSchema } from "@/lib/validators/password";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAuth } from "@/lib/auth/tenant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { currentPassword, newPassword } = parsed.data;

  const isCurrentValid = await verifyPassword(currentPassword, auth.user.passwordHash);
  if (!isCurrentValid) {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "currentPassword", reason: "mismatch" },
    ]);
  }

  const isSameAsCurrent = await verifyPassword(newPassword, auth.user.passwordHash);
  if (isSameAsCurrent) {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "newPassword", reason: "same_as_current" },
    ]);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { passwordHash, updatedAt: new Date() },
  });

  return new NextResponse(null, { status: 204 });
}
