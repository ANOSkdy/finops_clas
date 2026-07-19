import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireGlobal } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ userId: z.uuid() });

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const actor = await requireGlobal();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    if (parsed.data.userId === actor.userId) throw new AppError("CONFLICT", "自分自身のアカウントは削除できません", 409);
    await db.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: parsed.data.userId }, include: { _count: { select: { uploads: true, emails: true } } } });
      if (!target) throw new AppError("NOT_FOUND", "アカウントが見つかりません", 404);
      if (target.role === "global" && (await tx.user.count({ where: { role: "global" } })) <= 1) throw new AppError("CONFLICT", "最後のシステム管理者は削除できません", 409);
      if (target._count.uploads > 0 || target._count.emails > 0) throw new AppError("CONFLICT", "アップロードまたはメール監査記録があるため削除できません", 409);
      await tx.user.delete({ where: { id: target.id } });
      await tx.auditLog.create({ data: { actorUserId: actor.userId, action: "account.delete", entityType: "User", entityId: target.id, result: "success", metadata: { role: target.role } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return new NextResponse(null, { status: 204 });
  });
}
