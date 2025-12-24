import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { createUserSchema } from "@/lib/validators/account";
import { hashPassword } from "@/lib/auth/password";
import { requireAuth } from "@/lib/auth/tenant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (auth.user.role !== "admin") return jsonError(403, "FORBIDDEN", "権限がありません");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { loginId, name, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { loginId } });
  if (existing) return jsonError(409, "CONFLICT", "ログインIDが重複しています");

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      loginId,
      name,
      passwordHash,
      role,
    },
    select: { id: true, loginId: true, name: true, role: true, updatedAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
