import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/tenant";
import { companyMemberCreateSchema } from "@/lib/validators/companyMember";

export const runtime = "nodejs";

function shapeMembership(m: {
  company: { id: string; name: string; legalForm: "corporation" | "sole" };
  user: { id: string; name: string; loginId: string; role: string };
  roleInCompany: string;
  createdAt: Date;
}) {
  return {
    companyId: m.company.id,
    companyName: m.company.name,
    legalForm: m.company.legalForm,
    userId: m.user.id,
    userName: m.user.name,
    loginId: m.user.loginId,
    userRole: m.user.role,
    roleInCompany: m.roleInCompany,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (auth.user.role !== "global") return jsonError(403, "FORBIDDEN", "権限がありません");

  const [companies, users, memberships] = await Promise.all([
    prisma.company.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        legalForm: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        loginId: true,
        role: true,
      },
    }),
    prisma.membership.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true, legalForm: true } },
        user: { select: { id: true, name: true, loginId: true, role: true } },
      },
    }),
  ]);

  return NextResponse.json(
    {
      companies,
      users,
      memberships: memberships.map(shapeMembership),
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (auth.user.role !== "global") return jsonError(403, "FORBIDDEN", "権限がありません");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = companyMemberCreateSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { companyId, userId, roleInCompany } = parsed.data;

  const [company, user] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);

  if (!company) {
    return jsonError(404, "NOT_FOUND", "会社が見つかりません", [
      { field: "companyId", reason: "not_found" },
    ]);
  }

  if (!user) {
    return jsonError(404, "NOT_FOUND", "ユーザーが見つかりません", [
      { field: "userId", reason: "not_found" },
    ]);
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_companyId: { companyId, userId } },
  });

  if (existing) {
    return jsonError(409, "CONFLICT", "既に紐付け済みです", [
      { field: "companyId", reason: "duplicate" },
      { field: "userId", reason: "duplicate" },
    ]);
  }

  const membership = await prisma.membership.create({
    data: {
      companyId,
      userId,
      roleInCompany: roleInCompany ?? "member",
    },
    include: {
      company: { select: { id: true, name: true, legalForm: true } },
      user: { select: { id: true, name: true, loginId: true, role: true } },
    },
  });

  return NextResponse.json(shapeMembership(membership), { status: 201 });
}
