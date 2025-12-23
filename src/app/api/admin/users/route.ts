import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/tenant";
import { createUserSchema } from "@/lib/validators/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    const status = admin.status;
    return status === 401
      ? jsonError(401, "UNAUTHORIZED", "ログインが必要です")
      : jsonError(403, "FORBIDDEN", "管理者権限が必要です");
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const role = url.searchParams.get("role");

  const users = await prisma.user.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { loginId: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        role && (role === "admin" || role === "user") ? { role } : {},
      ],
    },
    select: {
      id: true,
      loginId: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ users });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    const status = admin.status;
    return status === 401
      ? jsonError(401, "UNAUTHORIZED", "ログインが必要です")
      : jsonError(403, "FORBIDDEN", "管理者権限が必要です");
  }

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
      reason: i.message ?? i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { loginId, password, name, role } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { loginId, passwordHash, name, role: role ?? "user" },
      select: {
        id: true,
        loginId: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonOk({ user }, 201);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(409, "CONFLICT", "このログインIDは既に使用されています");
    }
    throw e;
  }
}
