import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { readPrivateObject } from "@/lib/uploads/storage";
import { sendMail } from "@/lib/mail/provider";
import { enforceRateLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
const schema = z.object({
  recipient: z.email().max(254),
  subject: z.string().trim().min(1).max(200),
  body: z.string().min(1).max(20_000),
  attachmentIds: z.array(z.uuid()).min(1).max(10),
  idempotencyKey: z.string().min(8).max(100)
});
const MAX_MAIL_ATTACHMENTS = 25 * 1024 * 1024;

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    enforceRateLimit(`mail:${context.session.userId}`, 10, 60_000);
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const existing = await db.email.findUnique({ where: { companyId_idempotencyKey: { companyId: context.companyId, idempotencyKey: parsed.data.idempotencyKey } } });
    if (existing) return NextResponse.json({ email: { id: existing.id, status: existing.status }, auditSaved: true, reused: true });
    const uploads = await db.upload.findMany({ where: { id: { in: parsed.data.attachmentIds }, companyId: context.companyId } });
    if (uploads.length !== new Set(parsed.data.attachmentIds).size) throw new AppError("NOT_FOUND", "添付書類が見つかりません", 404);
    if (uploads.some((upload) => upload.purpose !== "trial_balance")) throw new AppError("FORBIDDEN", "試算表送付に使用できない添付書類が含まれています", 403);
    if (uploads.reduce((sum, upload) => sum + upload.size, 0) > MAX_MAIL_ATTACHMENTS) throw new AppError("VALIDATION_ERROR", "添付ファイルの合計サイズが上限を超えています", 400);
    let email: Prisma.EmailGetPayload<object>;
    try {
      email = await db.email.create({ data: { companyId: context.companyId, userId: context.session.userId, recipient: parsed.data.recipient, subject: parsed.data.subject, body: parsed.data.body, attachmentUploadIds: parsed.data.attachmentIds, idempotencyKey: parsed.data.idempotencyKey, status: "queued" } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const concurrent = await db.email.findUniqueOrThrow({ where: { companyId_idempotencyKey: { companyId: context.companyId, idempotencyKey: parsed.data.idempotencyKey } } });
      return NextResponse.json({ email: { id: concurrent.id, status: concurrent.status }, auditSaved: true, reused: true });
    }
    let providerMessageId: string;
    try {
      const attachments = await Promise.all(uploads.map(async (upload) => {
        const object = await readPrivateObject(upload.storageKey);
        return { filename: upload.originalName, content: object.toString("base64") };
      }));
      providerMessageId = await sendMail({ to: parsed.data.recipient, subject: parsed.data.subject, body: parsed.data.body, attachments });
    } catch (error) {
      const code = error instanceof AppError ? error.code : "MAIL_ERROR";
      await db.$transaction(async (tx) => {
        await tx.email.update({ where: { id: email.id }, data: { status: "failed", errorCode: code } });
        await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "email.send", entityType: "Email", entityId: email.id, result: "failed", metadata: { errorCode: code, attachmentCount: uploads.length } } });
      });
      return NextResponse.json({ error: { code: "MAIL_ERROR", message: "メールを送信できませんでした" }, auditSaved: true, email: { id: email.id, status: "failed" } }, { status: 503 });
    }
    const sent = await db.$transaction(async (tx) => {
      const updated = await tx.email.update({ where: { id: email.id }, data: { status: "sent", providerMessageId, sentAt: new Date() } });
      await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "email.send", entityType: "Email", entityId: email.id, result: "success", metadata: { attachmentCount: uploads.length } } });
      return updated;
    });
    return NextResponse.json({ email: { id: sent.id, status: sent.status }, auditSaved: true });
  });
}
