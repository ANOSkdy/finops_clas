import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { calculateRatingScore, SCORE_VERSION } from "@/lib/rating/scoring";
import { createRatingAdvisory } from "@/lib/rating/advisory";
import { enforceRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
const schema = z.object({ fileId: z.uuid() });

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    enforceRateLimit(`rating:${context.session.userId}`, 10, 60_000);
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const upload = await db.upload.findFirst({ where: { id: parsed.data.fileId, companyId: context.companyId } });
    if (!upload) throw new AppError("NOT_FOUND", "アップロード済み書類が見つかりません", 404);
    if (upload.purpose !== "rating") throw new AppError("FORBIDDEN", "この書類は財務格付けには使用できません", 403);
    const cached = await db.rating.findUnique({ where: { uploadId: upload.id } });
    if (cached) return NextResponse.json({ rating: cached, cached: true });
    const company = await db.company.findUniqueOrThrow({ where: { id: context.companyId } });
    const score = calculateRatingScore({ fileName: upload.originalName, mimeType: upload.mimeType, size: upload.size });
    const advisory = await createRatingAdvisory({ companyName: company.name, fileName: upload.originalName, mimeType: upload.mimeType, size: upload.size });
    let rating: Prisma.RatingGetPayload<object>;
    try {
      rating = await db.$transaction(async (tx) => {
        const created = await tx.rating.create({ data: { uploadId: upload.id, companyId: context.companyId, ...score, aiComment: advisory.aiComment, highlights: advisory.highlights, aiSource: advisory.source, scoreVersion: SCORE_VERSION, promptVersion: "rating-ja-v1", modelVersion: advisory.model } });
        await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "rating.finalize", entityType: "Rating", entityId: created.id, result: "success", metadata: { aiSource: created.aiSource, scoreVersion: created.scoreVersion } } });
        return created;
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      rating = await db.rating.findUniqueOrThrow({ where: { uploadId: upload.id } });
      return NextResponse.json({ rating, cached: true });
    }
    return NextResponse.json({ rating, cached: false }, { status: 201 });
  });
}
