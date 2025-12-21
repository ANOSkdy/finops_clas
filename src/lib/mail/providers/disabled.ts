import type { MailSendInput, MailSendResult } from "../types";

export async function sendDisabled(_: MailSendInput): Promise<MailSendResult> {
  return { status: "failed", error: "MAIL_PROVIDER_DISABLED" };
}