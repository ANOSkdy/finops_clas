import { z } from "zod";

export const ratingFinalizeSchema = z.object({
  fileId: z.string().uuid(),
});

export type RatingFinalizeRequest = z.infer<typeof ratingFinalizeSchema>;