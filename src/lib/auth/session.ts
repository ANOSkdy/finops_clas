import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const PROD_COOKIE_NAME = "__Host-clasz_session";
const DEV_COOKIE_NAME = "clasz_session";

export const SESSION_COOKIE_NAMES =
  process.env.NODE_ENV === "production"
    ? [PROD_COOKIE_NAME]
    : [DEV_COOKIE_NAME, PROD_COOKIE_NAME];

export const SESSION_COOKIE_NAME_TO_SET = SESSION_COOKIE_NAMES[0];

const SESSION_TTL_DAYS = 14;

export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

function requireSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error("AUTH_SESSION_SECRET is not set");
  return secret;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  const secret = requireSessionSecret();
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

export function sessionExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function createDbSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt: sessionExpiresAt(now),
      lastSeenAt: now,
    },
  });

  return { session, token };
}

export async function deleteDbSessionByToken(token: string) {
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export function readSessionToken(req: NextRequest): string | null {
  for (const name of SESSION_COOKIE_NAMES) {
    const v = req.cookies.get(name)?.value;
    if (v) return v;
  }
  return null;
}

export async function getSession(req: NextRequest) {
  const token = readSessionToken(req);
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt <= now) return null;

  prisma.session
    .update({ where: { id: session.id }, data: { lastSeenAt: now } })
    .catch(() => {});

  return { session, user: session.user, token };
}
