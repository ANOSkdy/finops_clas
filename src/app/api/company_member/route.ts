import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireGlobal } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ companyId: z.uuid(), userId: z.uuid(), roleInCompany: z.enum(["owner", "admin", "member", "accountant"]) });
const deleteSchema = z.object({ companyId: z.uuid(), userId: z.uuid() });

export async function GET() {
  return withApiError(async () => {
    await requireGlobal();
    const [memberships, users, companies] = await Promise.all([
      db.membership.findMany({ include: { user: { select: { id: true, name: true, loginId: true } }, company: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } }),
      db.user.findMany({ select: { id: true, name: true, loginId: true }, orderBy: { name: "asc" } }),
      db.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    ]);
    return NextResponse.json({ memberships, users, companies });
  });
}

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const actor = await requireGlobal();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    try {
      const membership = await db.$transaction(async (tx) => {
        const created = await tx.membership.create({ data: parsed.data });
        await tx.auditLog.create({ data: { companyId: parsed.data.companyId, actorUserId: actor.userId, action: "membership.create", entityType: "Membership", entityId: `${created.userId}:${created.companyId}`, result: "success", metadata: { role: created.roleInCompany } } });
        return created;
      });
      return NextResponse.json({ membership }, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("CONFLICT", "この所属は既に登録されています", 409);
      throw error;
    }
  });
}

export async function DELETE(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const actor = await requireGlobal();
    const parsed = deleteSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    if (parsed.data.userId === actor.userId) throw new AppError("CONFLICT", "自分自身の所属は解除できません", 409);
    await db.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({ where: { userId_companyId: parsed.data } });
      if (!membership) throw new AppError("NOT_FOUND", "所属が見つかりません", 404);
      if (["owner", "admin"].includes(membership.roleInCompany)) {
        const remaining = await tx.membership.count({ where: { companyId: parsed.data.companyId, roleInCompany: { in: ["owner", "admin"] }, userId: { not: parsed.data.userId } } });
        if (remaining === 0) throw new AppError("CONFLICT", "最後の会社管理者は解除できません", 409);
      }
      await tx.membership.delete({ where: { userId_companyId: parsed.data } });
      await tx.session.updateMany({ where: { userId: parsed.data.userId, activeCompanyId: parsed.data.companyId }, data: { activeCompanyId: null } });
      await tx.auditLog.create({ data: { companyId: parsed.data.companyId, actorUserId: actor.userId, action: "membership.delete", entityType: "Membership", entityId: `${membership.userId}:${membership.companyId}`, result: "success", metadata: { role: membership.roleInCompany } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return new NextResponse(null, { status: 204 });
  });
}
