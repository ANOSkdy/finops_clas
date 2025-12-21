import { z } from "zod";

export const manualSummarySchema = z.object({
  content: z.string().min(1).max(20000),
  maxLength: z.number().int().min(200).max(2000).optional().default(600),
});

export type ManualSummaryRequest = z.infer<typeof manualSummarySchema>;