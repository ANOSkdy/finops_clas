import type { MailSendInput, MailSendResult } from "../types";

export async function sendDisabled(_input: MailSendInput): Promise<MailSendResult> {
  void _input;
  return { status: "failed", error: "MAIL_PROVIDER_DISABLED" };
}