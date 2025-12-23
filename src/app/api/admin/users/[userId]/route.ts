import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/tenant";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  const userId = resolvedParams.userId;
  if (!userId) return jsonError(400, "VALIDATION_ERROR", "ユーザーIDが不正です");

  const admin = await requireAdmin(req);
  if (!admin.ok) {
    const status = admin.status;
    return status === 401
      ? jsonError(401, "UNAUTHORIZED", "ログインが必要です")
      : jsonError(403, "FORBIDDEN", "管理者権限が必要です");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "NOT_FOUND", "ユーザーが見つかりません");

  const [uploadsCount, emailsCount, membershipsCount, sessionsCount] =
    await prisma.$transaction([
      prisma.upload.count({ where: { userId } }),
      prisma.email.count({ where: { userId } }),
      prisma.membership.count({ where: { userId } }),
      prisma.session.count({ where: { userId } }),
    ]);

  if (uploadsCount > 0 || emailsCount > 0) {
    return jsonError(409, "CONFLICT", "関連データがあるため削除できません", [
      { field: "uploadsCount", reason: String(uploadsCount) },
      { field: "emailsCount", reason: String(emailsCount) },
    ]);
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // 依存が後続で作られたケース
      if (e.code === "P2003") {
        return jsonError(409, "CONFLICT", "関連データがあるため削除できません");
      }
    }
    throw e;
  }

  return jsonOk(
    {
      deleted: true,
      counts: { uploadsCount, emailsCount, membershipsCount, sessionsCount },
    },
    200
  );
}
