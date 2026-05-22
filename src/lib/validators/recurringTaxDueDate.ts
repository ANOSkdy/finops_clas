import { z } from "zod";

export const recurringTaxTypeSchema = z.enum(["fixed_asset_tax", "ordinary_resident_tax", "custom"]);

const recurringTaxDueDateFieldsSchema = z
  .object({
    taxType: recurringTaxTypeSchema,
    title: z.string().min(1).max(200),
    installmentLabel: z.string().max(100).nullable().optional(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    enabled: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.month === 2 && value.day > 28) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["day"], message: "2月は28日までです" });
      return;
    }
    if ([4, 6, 9, 11].includes(value.month) && value.day > 30) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["day"], message: "指定月に存在しない日付です" });
    }
  });

export const createRecurringTaxDueDateSchema = z.object({
  dueDate: recurringTaxDueDateFieldsSchema,
});

export const updateRecurringTaxDueDateSchema = z
  .object({
    dueDate: recurringTaxDueDateFieldsSchema.partial(),
  })
  .refine((value) => Object.keys(value.dueDate).length > 0, {
    message: "更新項目が必要です",
    path: ["dueDate"],
  });
