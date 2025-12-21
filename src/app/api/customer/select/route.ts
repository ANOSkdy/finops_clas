import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { customerSelectSchema } from "@/lib/validators/customer";
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

  const parsed = customerSelectSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { companyId } = parsed.data;

  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId: auth.user.id, companyId } },
  });
  if (!membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");

  await prisma.session.update({
    where: { id: auth.session.id },
    data: { activeCompanyId: companyId },
  });

  return new NextResponse(null, { status: 204 });
}