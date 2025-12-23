import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function requireAuth(req: NextRequest) {
  const s = await getSession(req);
  if (!s) return null;
  return s; // { session, user, token }
}

export async function requireActiveCompany(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return null;

  const companyId = auth.session.activeCompanyId;
  if (!companyId) return { auth, companyId: null, membership: null, company: null };

  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId: auth.user.id, companyId } },
  });

  if (!membership) {
    return { auth, companyId, membership: null, company: null };
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  return { auth, companyId, membership, company };
}

export async function requireAdmin(req: NextRequest) {
  const auth = await getSession(req);
  if (!auth) return { ok: false as const, status: 401 as const };
  if (auth.user.role !== "admin") return { ok: false as const, status: 403 as const, auth };
  return { ok: true as const, auth };
}
