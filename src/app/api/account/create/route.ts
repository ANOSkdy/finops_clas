import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireGlobal } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ loginId: z.string().trim().min(1).max(100), name: z.string().trim().min(1).max(100), password: z.string().min(8).max(200), role: z.enum(["user", "admin", "global"]), companyId: z.uuid().nullable().optional() });

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const actor = await requireGlobal();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    try {
      const user = await db.$transaction(async (tx) => {
        if (parsed.data.companyId && !(await tx.company.findUnique({ where: { id: parsed.data.companyId } }))) throw new AppError("NOT_FOUND", "会社が見つかりません", 404);
        const created = await tx.user.create({ data: { loginId: parsed.data.loginId, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password), role: parsed.data.role } });
        if (parsed.data.companyId) await tx.membership.create({ data: { userId: created.id, companyId: parsed.data.companyId, roleInCompany: "member" } });
        await tx.auditLog.create({ data: { companyId: parsed.data.companyId ?? null, actorUserId: actor.userId, action: "account.create", entityType: "User", entityId: created.id, result: "success", metadata: { role: created.role } } });
        return created;
      });
      return NextResponse.json({ user: { id: user.id, loginId: user.loginId, name: user.name, role: user.role } }, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("CONFLICT", "同じログインIDが既に登録されています", 409);
      throw error;
    }
  });
}
