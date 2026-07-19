import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { validateUploadMetadata } from "@/lib/uploads/policy";
import { enforceRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
const schema = z.object({ purpose: z.enum(["rating", "trial_balance"]), fileName: z.string().min(1).max(255), mimeType: z.string().min(1).max(120), size: z.number().int().positive() });

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    enforceRateLimit(`upload:${context.session.userId}`, 30, 60_000);
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const safeName = validateUploadMetadata(parsed.data.purpose, parsed.data.fileName, parsed.data.mimeType, parsed.data.size);
    if (process.env.NODE_ENV === "production" && !process.env.PRIVATE_STORAGE_DIRECTORY) return NextResponse.json({ error: { code: "STORAGE_ERROR", message: "ファイル保管サービスは現在利用できません" } }, { status: 503 });
    const grant = await db.uploadGrant.create({ data: { companyId: context.companyId, userId: context.session.userId, purpose: parsed.data.purpose, fileName: safeName, mimeType: parsed.data.mimeType, size: parsed.data.size, expiresAt: new Date(Date.now() + 10 * 60_000) } });
    return NextResponse.json({ available: true, grantId: grant.id, expiresAt: grant.expiresAt.toISOString() });
  });
}
