export type MailAttachment = { filename: string; url: string };

export type MailSendInput = {
  to: string;
  subject: string;
  body: string;
  attachments: MailAttachment[];
};

export type MailSendResult =
  | { status: "sent"; providerMessageId: string }
  | { status: "failed"; error: string };