import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ companyId: z.uuid() });

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const session = await requireAuth();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const membership = session.user.memberships.find((item) => item.companyId === parsed.data.companyId);
    if (!membership) throw new AppError("NOT_FOUND", "選択できる会社が見つかりません", 404);
    await db.session.update({ where: { id: session.id }, data: { activeCompanyId: parsed.data.companyId } });
    return new NextResponse(null, { status: 204 });
  });
}
