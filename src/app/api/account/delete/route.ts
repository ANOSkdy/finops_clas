import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/tenant";
import { ApiErrorDetail } from "@/lib/api/errors";

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

  const userId = (body as { userId?: string | null })?.userId;
  if (!userId) return jsonError(400, "VALIDATION_ERROR", "ユーザーIDが必要です", [
    { field: "userId", reason: "required" },
  ]);

  // RESTRICT のため uploads/emails があると削除できないので、事前チェックで理由を返す
  const [uploadsCount, emailsCount] = await Promise.all([
    prisma.upload.count({ where: { userId } }),
    prisma.email.count({ where: { userId } }),
  ]);

  if (uploadsCount > 0 || emailsCount > 0) {
    const details: ApiErrorDetail[] = [];
    if (uploadsCount > 0) details.push({ field: "uploads", reason: `count:${uploadsCount}` });
    if (emailsCount > 0) details.push({ field: "emails", reason: `count:${emailsCount}` });
    return jsonError(409, "CONFLICT", "関連データが残っているため削除できません", details);
  }

  await prisma.user.delete({ where: { id: userId } });

  return new NextResponse(null, { status: 204 });
}
