import { NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { uploadClientPayloadSchema } from "@/lib/validators/uploads";
import { isSafePathname } from "@/lib/uploads/path";
import { upsertUploadFromBlob } from "@/lib/uploads/db";

export const runtime = "nodejs";

function getBlobToken(): string | undefined {
  // default env name on Vercel is BLOB_READ_WRITE_TOKEN
  const envName = process.env.STORAGE_BLOB_TOKEN_ENV || "BLOB_READ_WRITE_TOKEN";
  return process.env[envName];
}

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_BYTES = 250 * 1024 * 1024; // 250MB

type UploadTokenPayload = {
  companyId?: unknown;
  userId?: unknown;
  purpose?: unknown;
  originalFilename?: unknown;
};

type BlobWithMetadata = {
  url: string;
  pathname: string;
  contentType?: string;
  size?: number;
};

function parseUploadTokenPayload(tokenPayload: string | null | undefined): UploadTokenPayload | null {
  if (!tokenPayload) return null;
  const parsed = JSON.parse(tokenPayload) as unknown;
  return typeof parsed === "object" && parsed !== null ? parsed : null;
}

export async function POST(request: NextRequest) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  // callback (blob.upload-completed) では cookie が無いので、認証必須にしない
  const isGenerateToken = (body as { type?: unknown }).type === "blob.generate-client-token";

  let authContext: Awaited<ReturnType<typeof requireActiveCompany>> | null = null;
  if (isGenerateToken) {
    authContext = await requireActiveCompany(request);
    if (!authContext) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
    if (!authContext.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
    if (!authContext.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  }

  try {
    const jsonResponse = await handleUpload({
      token: getBlobToken(),
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // token 発行時のみ呼ばれる想定
        if (!authContext || !authContext.companyId) {
          throw new Error("unauthorized");
        }

        if (!isSafePathname(pathname)) throw new Error("invalid_pathname");

        const parsed = uploadClientPayloadSchema.safeParse(
          clientPayload ? JSON.parse(clientPayload) : {}
        );
        if (!parsed.success) throw new Error("invalid_payload");

        const { purpose, originalFilename } = parsed.data;

        // pathname が company/purpose 配下になっていることを強制
        const requiredPrefix = `${authContext.companyId}/${purpose}/`;
        if (!pathname.startsWith(requiredPrefix)) throw new Error("pathname_scope_violation");

        return {
          addRandomSuffix: true,
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          tokenPayload: JSON.stringify({
            companyId: authContext.companyId,
            userId: authContext.auth.user.id,
            purpose,
            originalFilename: originalFilename ?? null,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // 本番ではここが呼ばれてDB更新できる（ローカルでは呼ばれない）
        try {
          const tp = parseUploadTokenPayload(tokenPayload);
          if (
            typeof tp?.companyId !== "string" ||
            typeof tp.userId !== "string" ||
            (tp.purpose !== "rating" && tp.purpose !== "trial_balance")
          ) return;
          const blobWithMetadata = blob as BlobWithMetadata;

          await upsertUploadFromBlob({
            companyId: tp.companyId,
            userId: tp.userId,
            purpose: tp.purpose,
            originalFilename: typeof tp.originalFilename === "string" ? tp.originalFilename : null,
            sha256: null,
            blob: {
              url: blobWithMetadata.url,
              pathname: blobWithMetadata.pathname,
              contentType: blobWithMetadata.contentType,
              size: blobWithMetadata.size,
            },
          });
        } catch {
          // best-effort
        }
      },
    });

    return jsonOk(jsonResponse);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e || "");
    if (msg.includes("BLOB_READ_WRITE_TOKEN")) {
      return jsonError(500, "STORAGE_ERROR", "Blob token が設定されていません");
    }
    return jsonError(500, "STORAGE_ERROR", "アップロード準備に失敗しました");
  }
}