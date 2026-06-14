import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { dedupeGeneratedTasks, syncGeneratedTaxTasks } from "@/lib/tasks/syncGeneratedTasks";
import { generateRecurringTaxDueDateTasks, generateTaxScheduleTasks } from "@/lib/tasks/taxSchedule";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const scoped = await requireActiveCompany(req);

  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  const taxSetting = await prisma.companyTaxSetting.findUnique({
    where: { companyId: scoped.companyId },
  });

  const generatedTaxTasks = generateTaxScheduleTasks({
    company: {
      legalForm: scoped.company.legalForm,
      fiscalClosingMonth:
        scoped.company.legalForm === "sole"
          ? 12
          : scoped.company.fiscalClosingMonth ?? 12,
      withholdingIncomeTaxPaymentSchedule:
        scoped.company.withholdingIncomeTaxPaymentSchedule,
      residentTaxPaymentSchedule: scoped.company.residentTaxPaymentSchedule,
    },
    taxSetting: {
      previousCorporateTaxNationalAmountYen: taxSetting?.previousCorporateTaxNationalAmountYen ?? null,
      isConsumptionTaxTaxableBusiness: taxSetting?.isConsumptionTaxTaxableBusiness ?? false,
      consumptionTaxReason: taxSetting?.consumptionTaxReason ?? null,
      previousConsumptionTaxNationalAmountYen: taxSetting?.previousConsumptionTaxNationalAmountYen ?? null,
    },
  });



  const recurringDueDates = await prisma.companyRecurringTaxDueDate.findMany({
    where: { companyId: scoped.companyId, enabled: true },
    select: { id: true, taxType: true, title: true, installmentLabel: true, month: true, day: true, enabled: true },
  });

  const generatedRecurringTasks = generateRecurringTaxDueDateTasks({
    dueDates: recurringDueDates,
  });

  const generatedTasks = dedupeGeneratedTasks({
    standardTasks: generatedTaxTasks,
    recurringTasks: generatedRecurringTasks,
  });

  await syncGeneratedTaxTasks({
    prisma,
    companyId: scoped.companyId,
    tasks: generatedTasks,
  });

  return jsonOk({ ok: true });
}
