import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { ratingFinalizeSchema } from "@/lib/validators/rating";
import { gradeFromScore, scoreFromUpload } from "@/lib/rating/scoring";
import { generateRatingComment, type RatingHighlight } from "@/lib/ai/ratingComment";

export const runtime = "nodejs";

function unpackAi(aiCommentRaw: string | null): { aiComment: string; highlights: RatingHighlight[] } {
  if (!aiCommentRaw) return { aiComment: "", highlights: [] };

  try {
    const j = JSON.parse(aiCommentRaw);
    if (j && typeof j.aiComment === "string" && Array.isArray(j.highlights)) {
      return {
        aiComment: j.aiComment,
        highlights: j.highlights as RatingHighlight[],
      };
    }
  } catch {
    // plain text fallback
  }
  return { aiComment: aiCommentRaw, highlights: [] };
}

export async function POST(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = ratingFinalizeSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { fileId } = parsed.data;

  const upload = await prisma.upload.findUnique({ where: { id: fileId } });
  if (!upload) return jsonError(404, "NOT_FOUND", "ファイルが見つかりません");
  if (upload.companyId !== scoped.companyId) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");

  if (upload.purpose !== "rating") {
    return jsonError(409, "CONFLICT", "このファイルはrating用ではありません");
  }

  // Cache: if exists, return without AI call
  const existing = await prisma.rating.findUnique({ where: { uploadId: upload.id } });
  if (existing) {
    const ai = unpackAi(existing.aiComment);
    return jsonOk({
      score: existing.score,
      grade: existing.grade,
      aiComment: ai.aiComment,
      highlights: ai.highlights,
    });
  }

  const score = scoreFromUpload({
    originalFilename: upload.originalFilename,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
  });
  const grade = gradeFromScore(score);

  const ai = await generateRatingComment({
    companyName: scoped.company.name,
    originalFilename: upload.originalFilename,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes.toString(),
  });

  // store JSON in ai_comment to preserve highlights too
  const stored = JSON.stringify({ aiComment: ai.aiComment, highlights: ai.highlights });

  await prisma.rating.upsert({
    where: { uploadId: upload.id },
    update: { score, grade, aiComment: stored },
    create: {
      companyId: scoped.companyId,
      uploadId: upload.id,
      score,
      grade,
      aiComment: stored,
    },
  });

  return jsonOk({ score, grade, aiComment: ai.aiComment, highlights: ai.highlights });
}