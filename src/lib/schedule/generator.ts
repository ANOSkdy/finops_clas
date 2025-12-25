import type { Prisma } from "@prisma/client";
import { addMonthsUTC, endOfMonthUTC, startOfMonthUTC } from "./date";
import { TASK_TEMPLATES, type CompanyProfile } from "./templates";

type GenerateTasksOptions = {
  horizonMonths: number;
};

function computeWindow(horizonMonths: number): { from: Date; to: Date } {
  const now = new Date();
  const from = startOfMonthUTC(now);
  const to = endOfMonthUTC(addMonthsUTC(from, horizonMonths));
  return { from, to };
}

function toProfile(company: any): CompanyProfile {
  return {
    id: company.id,
    legalForm: (company.legalForm as CompanyProfile["legalForm"]) ?? "corporation",
    fiscalClosingMonth:
      company.fiscalClosingMonth ??
      company.fiscal_closing_month ??
      company.fiscalMonth ??
      company.fiscal_month ??
      12,
    withholdingSchedule:
      (company.withholdingIncomeTaxPaymentSchedule as CompanyProfile["withholdingSchedule"]) ??
      (company.withholding_income_tax_payment_schedule as CompanyProfile["withholdingSchedule"]) ??
      "monthly",
    residentSchedule:
      (company.residentTaxPaymentSchedule as CompanyProfile["residentSchedule"]) ??
      (company.resident_tax_payment_schedule as CompanyProfile["residentSchedule"]) ??
      "monthly",
    locationCode: company.locationCode ?? company.location_code ?? null,
  };
}

export async function generateTasksForCompany(
  tx: Prisma.TransactionClient,
  companyId: string,
  options: GenerateTasksOptions
): Promise<void> {
  const company = await tx.company.findUniqueOrThrow({ where: { id: companyId } });
  const profile = toProfile(company);
  const window = computeWindow(options.horizonMonths);

  const data: Prisma.TaskCreateManyInput[] = [];
  for (const tpl of TASK_TEMPLATES) {
    if (!tpl.applies(profile)) continue;
    const occ = tpl.occurrences(profile, window);
    for (const o of occ) {
      data.push({
        companyId: profile.id,
        category: tpl.category,
        title: tpl.title(profile),
        dueDate: o.dueDate,
        status: "pending",
        source: "system",
        templateKey: tpl.key,
        templateVersion: tpl.version,
        archivedAt: null,
        meta: o.meta as Prisma.InputJsonValue | undefined,
      });
    }
  }

  if (data.length === 0) return;

  await tx.task.createMany({
    data,
    skipDuplicates: true,
  });
}
