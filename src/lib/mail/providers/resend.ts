import type { MailSendInput, MailSendResult } from "../types";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function sanitize(msg: string) {
  return msg.replace(/https?:\/\/[^\s]+/g, "https://***");
}

export async function sendResend(input: MailSendInput): Promise<MailSendResult> {
  try {
    const apiKey = requireEnv("MAIL_API_KEY");
    const from = requireEnv("MAIL_FROM");
    const replyTo = process.env.MAIL_REPLY_TO || undefined;

    const payload: any = {
      from,
      to: [input.to],
      subject: input.subject,
      text: input.body,
    };

    if (replyTo) payload.replyTo = replyTo;

    if (input.attachments.length > 0) {
      payload.attachments = input.attachments.map((a) => ({
        path: a.url,      // remote URL attachment
        filename: a.filename,
      }));
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json: any = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        json?.message ||
        json?.error?.message ||
        `resend_error_${res.status}`;
      return { status: "failed", error: sanitize(String(msg)) };
    }

    const id = json?.id;
    if (!id) return { status: "failed", error: "resend_missing_id" };
    return { status: "sent", providerMessageId: String(id) };
  } catch (e: any) {
    return { status: "failed", error: sanitize(String(e?.message || e)) };
  }
}