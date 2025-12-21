import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { uploadCompleteSchema } from "@/lib/validators/uploads";
import { upsertUploadFromBlob } from "@/lib/uploads/db";

export const runtime = "nodejs";

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

  const parsed = uploadCompleteSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const v = parsed.data;

  const result = await upsertUploadFromBlob({
    companyId: scoped.companyId,
    userId: scoped.auth.user.id,
    purpose: v.purpose,
    originalFilename: v.originalFilename ?? null,
    sha256: v.sha256 ?? null,
    blob: v.blob,
  });

  return jsonOk({ fileId: result.fileId, reused: result.reused, url: v.blob.url });
}