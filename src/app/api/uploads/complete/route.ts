import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { storageKey, validateFileSignature, validateUploadMetadata } from "@/lib/uploads/policy";
import { deletePrivateObject, storePrivateObject } from "@/lib/uploads/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    const form = await request.formData();
    const grantId = form.get("grantId");
    const sha256 = form.get("sha256");
    const file = form.get("file");
    if (typeof grantId !== "string" || !z.uuid().safeParse(grantId).success || !(file instanceof File)) throw new AppError("VALIDATION_ERROR", "アップロード情報が正しくありません", 400);
    if (typeof sha256 === "string" && sha256 && !/^[a-f0-9]{64}$/i.test(sha256)) throw new AppError("VALIDATION_ERROR", "ファイル検証値が正しくありません", 400);
    const grant = await db.uploadGrant.findFirst({ where: { id: grantId, companyId: context.companyId, userId: context.session.userId, consumedAt: null, expiresAt: { gt: new Date() } } });
    if (!grant) throw new AppError("FORBIDDEN", "アップロード許可が無効です", 403);
    const safeName = validateUploadMetadata(grant.purpose as "rating" | "trial_balance", file.name, file.type, file.size);
    if (safeName !== grant.fileName || file.type !== grant.mimeType || file.size !== grant.size) throw new AppError("FORBIDDEN", "選択したファイルがアップロード許可と一致しません", 403);
    const bytes = new Uint8Array(await file.arrayBuffer());
    validateFileSignature(safeName, bytes);
    const computedSha256 = createHash("sha256").update(bytes).digest("hex");
    if (typeof sha256 === "string" && sha256 && computedSha256 !== sha256.toLowerCase()) throw new AppError("VALIDATION_ERROR", "ファイル検証値が一致しません", 400);
    const key = storageKey(context.companyId, grant.purpose as "rating" | "trial_balance", safeName);
    const blob = await storePrivateObject(key, bytes);
    let upload;
    try {
      upload = await db.$transaction(async (tx) => {
        const claimed = await tx.uploadGrant.updateMany({ where: { id: grant.id, consumedAt: null }, data: { consumedAt: new Date() } });
        if (claimed.count !== 1) throw new AppError("CONFLICT", "このアップロード許可は使用済みです", 409);
        const created = await tx.upload.create({ data: { companyId: context.companyId, userId: context.session.userId, purpose: grant.purpose, originalName: safeName, mimeType: file.type, size: file.size, sha256: computedSha256, storageKey: blob.pathname, storageUrl: blob.url, accessMode: "private" } });
        await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "upload.complete", entityType: "Upload", entityId: created.id, result: "success", metadata: { purpose: created.purpose, size: created.size } } });
        return created;
      });
    } catch (error) {
      await deletePrivateObject(blob.pathname);
      throw error;
    }
    return NextResponse.json({ file: { id: upload.id, name: upload.originalName, mimeType: upload.mimeType, size: upload.size, purpose: upload.purpose }, reused: false }, { status: 201 });
  });
}
