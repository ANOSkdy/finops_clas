import { z } from "zod";

const moneyStringSchema = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null;
  return v;
}, z.string().regex(/^\d+$/, "0以上の整数（円）で入力してください").nullable());

export const consumptionTaxReasonSchema = z.enum([
  "sales_over_10m",
  "taxable_selection",
  "invoice_registered",
  "other",
]);

export const companyTaxSettingUpdateSchema = z.object({
  taxSetting: z.object({
    previousCorporateTaxNationalAmountYen: moneyStringSchema.optional(),
    isConsumptionTaxTaxableBusiness: z.boolean(),
    consumptionTaxReason: consumptionTaxReasonSchema.nullable().optional(),
    previousConsumptionTaxNationalAmountYen: moneyStringSchema.optional(),
  }),
});

export type CompanyTaxSettingUpdateRequest = z.infer<typeof companyTaxSettingUpdateSchema>;
export type ConsumptionTaxReason = z.infer<typeof consumptionTaxReasonSchema>;
