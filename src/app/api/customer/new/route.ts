import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({
  legalForm: z.enum(["corporation", "sole_proprietor"]),
  name: z.string().trim().min(1).max(200),
  closingMonth: z.number().int().min(1).max(12),
  representativeName: z.string().trim().max(100).optional().nullable(),
  email: z.email().max(254).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  postalCode: z.string().trim().max(12).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable()
});

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const session = await requireAuth();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const company = await db.$transaction(async (tx) => {
      const created = await tx.company.create({ data: { ...parsed.data, closingMonth: parsed.data.legalForm === "sole_proprietor" ? 12 : parsed.data.closingMonth } });
      await tx.membership.create({ data: { userId: session.userId, companyId: created.id, roleInCompany: "owner" } });
      await tx.session.update({ where: { id: session.id }, data: { activeCompanyId: created.id } });
      await tx.auditLog.create({ data: { companyId: created.id, actorUserId: session.userId, action: "company.create", entityType: "Company", entityId: created.id, result: "success" } });
      return created;
    });
    return NextResponse.json({ company: { id: company.id, name: company.name } }, { status: 201 });
  });
}
