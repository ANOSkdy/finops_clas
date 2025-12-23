import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/tenant";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    const status = admin.status;
    return status === 401
      ? jsonError(401, "UNAUTHORIZED", "ログインが必要です")
      : jsonError(403, "FORBIDDEN", "管理者権限が必要です");
  }

  const userId = params.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "NOT_FOUND", "ユーザーが見つかりません");

  const [uploadsCount, emailsCount, membershipsCount, sessionsCount] =
    await prisma.$transaction([
      prisma.upload.count({ where: { userId } }),
      prisma.email.count({ where: { userId } }),
      prisma.membership.count({ where: { userId } }),
      prisma.session.count({ where: { userId } }),
    ]);

  return jsonOk({
    user: { id: user.id, loginId: user.loginId, name: user.name, role: user.role },
    counts: { uploadsCount, emailsCount, membershipsCount, sessionsCount },
  });
}
