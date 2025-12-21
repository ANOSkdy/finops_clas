import { z } from "zod";

export const mailSendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  attachmentFileIds: z.array(z.string().uuid()).max(10).default([]),
});

export type MailSendRequest = z.infer<typeof mailSendSchema>;