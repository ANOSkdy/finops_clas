import { createHmac, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { AppError } from "@/lib/api/errors";

const SESSION_DAYS = 14;
const DEV_COOKIE = "clasz_session";
const PROD_COOKIE = "__Host-clasz_session";

type SessionMembership = {
  userId: string;
  companyId: string;
  roleInCompany: string;
  company: {
    id: string;
    name: string;
    legalForm: string;
    representativeName: string | null;
    email: string | null;
  };
};

type SessionQueryRow = {
  id: string;
  tokenHash: string;
  userId: string;
  activeCompanyId: string | null;
  expiresAt: Date;
  lastAccessedAt: Date;
  createdAt: Date;
  user: { id: string; loginId: string; name: string; passwordHash: string; role: string };
  activeCompany: { id: string; name: string; legalForm: string } | null;
  memberships: SessionMembership[];
};

function cookieName() {
  return process.env.NODE_ENV === "production" ? PROD_COOKIE : DEV_COOKIE;
}

function sessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new AppError("INTERNAL", "認証サービスを利用できません", 503);
  return secret;
}

export function hashSessionToken(token: string, secret = sessionSecret()) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { userId, tokenHash: hashSessionToken(token), expiresAt } });
  const store = await cookies();
  store.set(cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function deleteCurrentSession() {
  const store = await cookies();
  const token = store.get(cookieName())?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  store.set(cookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export const getSession = cache(async function getSession() {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return null;
  const rows = await db.$queryRaw<SessionQueryRow[]>(Prisma.sql`
    SELECT
      s."id",
      s."token_hash" AS "tokenHash",
      s."user_id" AS "userId",
      s."active_company_id" AS "activeCompanyId",
      s."expires_at" AS "expiresAt",
      s."last_accessed_at" AS "lastAccessedAt",
      s."created_at" AS "createdAt",
      jsonb_build_object(
        'id', u."id",
        'loginId', u."loginId",
        'name', u."name",
        'passwordHash', u."password_hash",
        'role', u."role"
      ) AS "user",
      CASE WHEN active_company."id" IS NULL THEN NULL ELSE jsonb_build_object(
        'id', active_company."id",
        'name', active_company."name",
        'legalForm', active_company."legal_form"
      ) END AS "activeCompany",
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'userId', membership."user_id",
          'companyId', membership."company_id",
          'roleInCompany', membership."role_in_company",
          'company', jsonb_build_object(
            'id', company."id",
            'name', company."name",
            'legalForm', company."legal_form",
            'representativeName', company."representative_name",
            'email', company."email"
          )
        ) ORDER BY company."name")
        FROM "memberships" membership
        JOIN "companies" company ON company."id" = membership."company_id"
        WHERE membership."user_id" = s."user_id"
      ), '[]'::jsonb) AS "memberships"
    FROM "sessions" s
    JOIN "users" u ON u."id" = s."user_id"
    LEFT JOIN "companies" active_company ON active_company."id" = s."active_company_id"
    WHERE s."token_hash" = ${hashSessionToken(token)}
    LIMIT 1
  `);
  const row = rows[0];
  const session = row ? { ...row, user: { ...row.user, memberships: row.memberships } } : null;
  if (!session || session.expiresAt <= new Date()) {
    if (session) await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  const accessUpdateThreshold = new Date(Date.now() - 5 * 60_000);
  if (session.lastAccessedAt < accessUpdateThreshold) {
    void db.session.updateMany({
      where: { id: session.id, lastAccessedAt: { lt: accessUpdateThreshold } },
      data: { lastAccessedAt: new Date() }
    }).catch(() => undefined);
  }
  return session;
});

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new AppError("UNAUTHORIZED", "ログインが必要です", 401);
  return session;
}

export async function requireActiveCompany() {
  const session = await requireAuth();
  if (!session.activeCompanyId) throw new AppError("NOT_FOUND", "操作する会社を選択してください", 404);
  const membership = session.user.memberships.find((item) => item.companyId === session.activeCompanyId);
  if (!membership) throw new AppError("NOT_FOUND", "操作する会社を選択してください", 404);
  return { session, companyId: session.activeCompanyId, membership };
}

export async function requireGlobal() {
  const session = await requireAuth();
  if (session.user.role !== "global") throw new AppError("FORBIDDEN", "システム管理者の権限が必要です", 403);
  return session;
}

export async function requireCompanyEditor() {
  const context = await requireActiveCompany();
  const allowed =
    context.session.user.role === "global" ||
    context.session.user.role === "admin" ||
    context.membership.roleInCompany === "admin";
  if (!allowed) throw new AppError("FORBIDDEN", "会社設定を変更する権限がありません", 403);
  return context;
}
