import { z } from "zod";

export const uploadPurposeSchema = z.enum(["rating", "trial_balance"]);
export type UploadPurpose = z.infer<typeof uploadPurposeSchema>;

export const uploadClientPayloadSchema = z.object({
  purpose: uploadPurposeSchema,
  originalFilename: z.string().max(255).optional().nullable(),
});

export const uploadCompleteSchema = z.object({
  purpose: uploadPurposeSchema,
  originalFilename: z.string().max(255).optional().nullable(),
  sha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/i)
    .optional()
    .nullable(),
  blob: z.object({
    url: z.string().url(),
    pathname: z.string().min(1).optional(),
    contentType: z.string().min(1).optional(),
    size: z.number().int().nonnegative().optional(),
  }),
});

export type UploadCompleteRequest = z.infer<typeof uploadCompleteSchema>;