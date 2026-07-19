import { AppError } from "@/lib/api/errors";

export type MailAttachment = { filename: string; content: string };

export async function sendMail(input: { to: string; subject: string; body: string; attachments: MailAttachment[] }) {
  if ((process.env.MAIL_PROVIDER ?? "disabled") !== "resend") {
    throw new AppError("MAIL_ERROR", "メール送信サービスは現在利用できません", 503);
  }
  const apiKey = process.env.MAIL_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) throw new AppError("MAIL_ERROR", "メール送信サービスは現在利用できません", 503);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.body,
        ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}),
        attachments: input.attachments
      })
    });
    if (!response.ok) throw new AppError("MAIL_ERROR", "メールを送信できませんでした", 503);
    const data = (await response.json()) as { id?: unknown };
    if (typeof data.id !== "string") throw new AppError("MAIL_ERROR", "メール送信結果を確認できませんでした", 503);
    return data.id;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("MAIL_ERROR", "メールを送信できませんでした", 503);
  } finally {
    clearTimeout(timeout);
  }
}
