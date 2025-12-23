import { z } from "zod";

export const companyIdSchema = z.string().uuid();

export const customerSelectSchema = z.object({
  companyId: companyIdSchema,
});

export const legalFormSchema = z.enum(["corporation", "sole"]);
export const paymentScheduleSchema = z.enum(["monthly", "special"]);
export const corporateNumberSchema = z
  .string()
  .regex(/^[0-9]{13}$/, "法人番号は13桁の数字で入力してください");
const establishedOnSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "設立年月日はYYYY-MM-DD形式で入力してください")
  .refine((v) => !Number.isNaN(Date.parse(v)), "設立年月日が不正です");

export const customerNewSchema = z
  .object({
    name: z.string().min(1).max(200),
    legalForm: legalFormSchema,
    address: z.string().max(500).optional().nullable(),
    fiscalClosingMonth: z.number().int().min(1).max(12),
    representativeName: z.string().max(200).optional().nullable(),
    contactEmail: z.string().email().optional().nullable(),
    contactPhone: z.string().max(50).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.legalForm === "sole" && v.fiscalClosingMonth !== 12) {
      ctx.addIssue({
        code: "custom",
        message: "sole の場合 fiscalClosingMonth は 12 固定です",
        path: ["fiscalClosingMonth"],
      });
    }
  });

export const customerUpdateSchema = z
  .object({
    company: z.object({
      name: z.string().min(1).max(200),
      address: z.string().max(500).optional().nullable(),
      fiscalClosingMonth: z.number().int().min(1).max(12),
      representativeName: z.string().max(200).optional().nullable(),
      contactEmail: z.string().email().optional().nullable(),
      contactPhone: z.string().max(50).optional().nullable(),
      corporateNumber: corporateNumberSchema.optional().nullable(),
      establishedOn: establishedOnSchema.optional().nullable(),
      withholdingIncomeTaxPaymentSchedule: paymentScheduleSchema.optional().nullable(),
      residentTaxPaymentSchedule: paymentScheduleSchema.optional().nullable(),
    }),
  })
  .superRefine((v, ctx) => {
    // legalForm はサーバ側で既存値に基づき強制する（ここでは形式だけ）
    if (v.company.fiscalClosingMonth < 1 || v.company.fiscalClosingMonth > 12) {
      ctx.addIssue({
        code: "custom",
        message: "fiscalClosingMonth は 1〜12 です",
        path: ["company", "fiscalClosingMonth"],
      });
    }
  });

export type CustomerSelectRequest = z.infer<typeof customerSelectSchema>;
export type CustomerNewRequest = z.infer<typeof customerNewSchema>;
export type CustomerUpdateRequest = z.infer<typeof customerUpdateSchema>;
