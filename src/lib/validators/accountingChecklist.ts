import { z } from "zod";

export const accountingChecklistFiscalYearSchema = z.number().int().min(2000).max(2100);
export const accountingChecklistMonthSchema = z.number().int().min(1).max(12);
export const accountingChecklistItemIdSchema = z.string().uuid();
export const accountingChecklistItemNameSchema = z.string().trim().min(1).max(100);

export const accountingChecklistQuerySchema = z.object({
  fiscalYear: accountingChecklistFiscalYearSchema.optional(),
});

export const createAccountingChecklistItemSchema = z.object({
  name: accountingChecklistItemNameSchema,
});

export const upsertAccountingChecklistCheckSchema = z.object({
  itemId: accountingChecklistItemIdSchema,
  fiscalYear: accountingChecklistFiscalYearSchema,
  month: accountingChecklistMonthSchema,
  checked: z.boolean(),
});

export type CreateAccountingChecklistItemRequest = z.infer<typeof createAccountingChecklistItemSchema>;
export type UpsertAccountingChecklistCheckRequest = z.infer<typeof upsertAccountingChecklistCheckSchema>;
