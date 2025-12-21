import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { mailSendSchema } from "@/lib/validators/mail";
import { sendMail, getMailProviderName } from "@/lib/mail";
import type { MailAttachment } from "@/lib/mail/types";

export const runtime = "nodejs";

function safeFilename(name: string) {
  const cleaned = (name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(0, 120) || "file";
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

  const parsed = mailSendSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const v = parsed.data;

  const ids = v.attachmentFileIds ?? [];
  const uploads = ids.length
    ? await prisma.upload.findMany({
        where: { id: { in: ids }, companyId: scoped.companyId },
        select: { id: true, storageKey: true, originalFilename: true, purpose: true },
      })
    : [];

  if (uploads.length !== ids.length) {
    return jsonError(403, "FORBIDDEN", "添付ファイルにアクセスできません");
  }

  const wrongPurpose = uploads.find((u) => u.purpose !== "trial_balance");
  if (wrongPurpose) {
    return jsonError(409, "CONFLICT", "添付は trial_balance のアップロードのみ対応です");
  }

  const attachments: MailAttachment[] = uploads.map((u) => ({
    filename: safeFilename(u.originalFilename),
    url: u.storageKey,
  }));

  const emailRow = await prisma.email.create({
    data: {
      companyId: scoped.companyId,
      userId: scoped.auth.user.id,
      mailTo: v.to,
      subject: v.subject,
      body: v.body,
      attachmentUploadIds: ids,
      status: "queued",
    },
    select: { id: true },
  });

  const provider = getMailProviderName();
  const sendRes = await sendMail({
    to: v.to,
    subject: v.subject,
    body: v.body,
    attachments,
  });

  if (sendRes.status === "sent") {
    await prisma.email.update({
      where: { id: emailRow.id },
      data: { status: "sent", providerMessageId: sendRes.providerMessageId, error: null },
    });
    return jsonOk({ status: "sent", providerMessageId: sendRes.providerMessageId });
  }

  await prisma.email.update({
    where: { id: emailRow.id },
    data: {
      status: "failed",
      providerMessageId: null,
      error: `provider=${provider}; ${sendRes.error}`.slice(0, 500),
    },
  });

  const isDisabled = sendRes.error === "MAIL_PROVIDER_DISABLED";
  return jsonError(
    isDisabled ? 503 : 500,
    "MAIL_ERROR",
    isDisabled
      ? "メール送信が無効化されています（MAIL_PROVIDER=disabled）"
      : "メール送信に失敗しました"
  );
}