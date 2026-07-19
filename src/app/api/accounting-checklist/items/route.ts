import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(1).max(100) });

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    try {
      const count = await db.accountingChecklistItem.count({ where: { companyId: context.companyId } });
      const item = await db.accountingChecklistItem.create({ data: { companyId: context.companyId, name: parsed.data.name.normalize("NFKC"), position: count } });
      return NextResponse.json({ item }, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("CONFLICT", "同じ名前の項目が既にあります", 409);
      throw error;
    }
  });
}
