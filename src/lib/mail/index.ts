import type { MailSendInput, MailSendResult } from "./types";
import { sendDisabled } from "./providers/disabled";
import { sendResend } from "./providers/resend";

export function getMailProviderName() {
  return (process.env.MAIL_PROVIDER || "disabled").toLowerCase();
}

export async function sendMail(input: MailSendInput): Promise<MailSendResult> {
  const provider = getMailProviderName();
  if (provider === "resend") return sendResend(input);
  return sendDisabled(input);
}