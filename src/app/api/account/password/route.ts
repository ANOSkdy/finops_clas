import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(8).max(200), confirmPassword: z.string().min(8).max(200) }).refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "確認用パスワードが一致しません" }).refine((value) => value.currentPassword !== value.newPassword, { path: ["newPassword"], message: "現在と異なるパスワードを指定してください" });

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const session = await requireAuth();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    if (!(await verifyPassword(parsed.data.currentPassword, session.user.passwordHash))) throw new AppError("UNAUTHORIZED", "現在のパスワードが正しくありません", 401);
    await db.$transaction([
      db.user.update({ where: { id: session.userId }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } }),
      db.session.deleteMany({ where: { userId: session.userId, id: { not: session.id } } }),
      db.auditLog.create({ data: { actorUserId: session.userId, action: "account.password.update", entityType: "User", entityId: session.userId, result: "success" } })
    ]);
    return new NextResponse(null, { status: 204 });
  });
}
