import {
  addMonthsClampedUtc,
  addMonthsUtc,
  adjustToNextBusinessDay,
  endOfMonthUtc,
  startOfUtcDay,
  toUtcDateOnly,
} from "@/lib/date/businessDay";

export type GeneratedTask = {
  taskKey: string;
  category: "tax" | "social" | "other";
  title: string;
  dueDate: Date;
  periodStart?: Date | null;
  periodEnd?: Date | null;
};

export type TaxScheduleCompanyInput = {
  legalForm: string;
  fiscalClosingMonth: number | null;
  withholdingIncomeTaxPaymentSchedule: string | null;
  residentTaxPaymentSchedule: string | null;
};

export type TaxScheduleTaxSettingInput = {
  previousCorporateTaxNationalAmountYen?: bigint | number | string | null;
  isConsumptionTaxTaxableBusiness?: boolean | null;
  consumptionTaxReason?: string | null;
  previousConsumptionTaxNationalAmountYen?: bigint | number | string | null;
};

const TAX_CATEGORY: GeneratedTask["category"] = "tax";

function monthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addDaysUtc(date: Date, days: number): Date {
  return toUtcDateOnly(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate() + days);
}

function toBigIntOrNull(value: bigint | number | string | null | undefined): bigint | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return Number.isFinite(value) ? BigInt(Math.trunc(value)) : null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function getConsumptionInterimCount(amount: bigint | null): 0 | 1 | 3 | 11 {
  if (amount === null || amount <= BigInt(480000)) return 0;
  if (amount <= BigInt(4000000)) return 1;
  if (amount <= BigInt(48000000)) return 3;
  return 11;
}



export type RecurringTaxDueDateInput = {
  id: string;
  taxType: string;
  title: string;
  installmentLabel: string | null;
  month: number;
  day: number;
  enabled: boolean;
};

export function generateRecurringTaxDueDateTasks(input: {
  dueDates: RecurringTaxDueDateInput[];
  fromDate?: Date;
  monthsAhead?: number;
  holidays?: Set<string>;
}): GeneratedTask[] {
  const today = startOfUtcDay(input.fromDate ?? new Date());
  const monthsAhead = input.monthsAhead ?? 36;
  const endDate = addMonthsUtc(today, monthsAhead);
  const startYear = today.getUTCFullYear();
  const endYear = endDate.getUTCFullYear();
  const tasks: GeneratedTask[] = [];

  for (const dueDateSetting of input.dueDates) {
    if (!dueDateSetting.enabled) continue;
    for (let year = startYear; year <= endYear; year += 1) {
      const adjustedDueDate = adjustToNextBusinessDay(toUtcDateOnly(year, dueDateSetting.month, dueDateSetting.day), input.holidays);
      if (adjustedDueDate < today) continue;
      tasks.push({
        taskKey: `tax:recurring:${dueDateSetting.taxType}:${dueDateSetting.id}:${year}`,
        category: TAX_CATEGORY,
        title: dueDateSetting.installmentLabel ? `${dueDateSetting.title}（${dueDateSetting.installmentLabel}）` : dueDateSetting.title,
        dueDate: adjustedDueDate,
        periodStart: null,
        periodEnd: null,
      });
    }
  }

  return tasks;
}
export function generateTaxScheduleTasks(input: {
  company: TaxScheduleCompanyInput;
  taxSetting?: TaxScheduleTaxSettingInput | null;
  fromDate?: Date;
  monthsAhead?: number;
  holidays?: Set<string>;
}): GeneratedTask[] {
  const { company, holidays, taxSetting } = input;
  const monthsAhead = input.monthsAhead ?? 36;
  const today = startOfUtcDay(input.fromDate ?? new Date());
  const fromMonth = toUtcDateOnly(today.getUTCFullYear(), today.getUTCMonth() + 1, 1);

  const tasks: GeneratedTask[] = [];
  const withholdingSpecial = company.withholdingIncomeTaxPaymentSchedule === "special";
  const residentTaxSpecial = company.residentTaxPaymentSchedule === "special";
  const isCorporation = company.legalForm !== "sole";
  const isTaxableBusiness = taxSetting?.isConsumptionTaxTaxableBusiness === true;
  const previousCorporateTax = toBigIntOrNull(taxSetting?.previousCorporateTaxNationalAmountYen);
  const previousConsumptionTax = toBigIntOrNull(taxSetting?.previousConsumptionTaxNationalAmountYen);
  const consumptionInterimCount = getConsumptionInterimCount(previousConsumptionTax);

  for (let i = 1; i <= monthsAhead; i += 1) {
    const dueMonthStart = addMonthsUtc(fromMonth, i);
    const dueDate = adjustToNextBusinessDay(
      toUtcDateOnly(dueMonthStart.getUTCFullYear(), dueMonthStart.getUTCMonth() + 1, 10),
      holidays,
    );

    if (!withholdingSpecial) {
      tasks.push({
        taskKey: `tax:withholding:monthly:${monthKey(dueMonthStart)}`,
        category: TAX_CATEGORY,
        title: "源泉所得税・復興特別所得税（毎月納付）",
        dueDate,
      });
    }

    if (!residentTaxSpecial) {
      tasks.push({
        taskKey: `tax:resident-special-collection:monthly:${monthKey(dueMonthStart)}`,
        category: TAX_CATEGORY,
        title: "住民税（特別徴収）納入（毎月）",
        dueDate,
      });
    }
  }

  const startYear = today.getUTCFullYear();
  const endYear = addMonthsUtc(fromMonth, monthsAhead).getUTCFullYear();
  for (let year = startYear; year <= endYear; year += 1) {
    if (withholdingSpecial) {
      tasks.push({
        taskKey: `tax:withholding:special:h1:${year}`,
        category: TAX_CATEGORY,
        title: "源泉所得税・復興特別所得税（納期の特例：1〜6月分）",
        dueDate: adjustToNextBusinessDay(toUtcDateOnly(year, 7, 10), holidays),
        periodStart: toUtcDateOnly(year, 1, 1),
        periodEnd: toUtcDateOnly(year, 6, 30),
      });
      tasks.push({
        taskKey: `tax:withholding:special:h2:${year}`,
        category: TAX_CATEGORY,
        title: "源泉所得税・復興特別所得税（納期の特例：7〜12月分）",
        dueDate: adjustToNextBusinessDay(toUtcDateOnly(year, 1, 20), holidays),
        periodStart: toUtcDateOnly(year - 1, 7, 1),
        periodEnd: toUtcDateOnly(year - 1, 12, 31),
      });
    }

    if (residentTaxSpecial) {
      tasks.push({
        taskKey: `tax:resident-special-collection:special:h1:${year}`,
        category: TAX_CATEGORY,
        title: "住民税（特別徴収）納入（納期の特例：12〜5月分）",
        dueDate: adjustToNextBusinessDay(toUtcDateOnly(year, 6, 10), holidays),
        periodStart: toUtcDateOnly(year - 1, 12, 1),
        periodEnd: toUtcDateOnly(year, 5, 31),
      });
      tasks.push({
        taskKey: `tax:resident-special-collection:special:h2:${year}`,
        category: TAX_CATEGORY,
        title: "住民税（特別徴収）納入（納期の特例：6〜11月分）",
        dueDate: adjustToNextBusinessDay(toUtcDateOnly(year, 12, 10), holidays),
        periodStart: toUtcDateOnly(year, 6, 1),
        periodEnd: toUtcDateOnly(year, 11, 30),
      });
    }

    tasks.push({
      taskKey: `tax:annual-submissions:${year}`,
      category: TAX_CATEGORY,
      title: "法定調書・給与支払報告書・償却資産申告（提出期限）",
      dueDate: adjustToNextBusinessDay(toUtcDateOnly(year, 1, 31), holidays),
    });

    if (isCorporation) {
      const fiscalClosingMonth = company.fiscalClosingMonth ?? 12;
      const fiscalYearEnd = endOfMonthUtc(year, fiscalClosingMonth);
      const fiscalYearLabel = `${year}-${String(fiscalClosingMonth).padStart(2, "0")}`;
      const fiscalYearStart = toUtcDateOnly(year - 1, fiscalClosingMonth + 1, 1);
      const corporateDueDate = adjustToNextBusinessDay(addMonthsClampedUtc(fiscalYearEnd, 2), holidays);

      tasks.push({
        taskKey: `tax:corporate-final:${fiscalYearLabel}`,
        category: TAX_CATEGORY,
        title: "法人税・地方税（確定申告・納付）",
        dueDate: corporateDueDate,
      });

      if (previousCorporateTax !== null && previousCorporateTax > BigInt(200000)) {
        const interimAnchor = addMonthsUtc(fiscalYearStart, 6);
        const interimPeriodEnd = endOfMonthUtc(interimAnchor.getUTCFullYear(), interimAnchor.getUTCMonth() + 1);
        tasks.push({
          taskKey: `tax:corporate-interim:${fiscalYearLabel}`,
          category: TAX_CATEGORY,
          title: "法人税・地方税（予定納税・中間申告）",
          dueDate: adjustToNextBusinessDay(addMonthsClampedUtc(interimPeriodEnd, 2), holidays),
          periodStart: fiscalYearStart,
          periodEnd: interimPeriodEnd,
        });
      }

      if (isTaxableBusiness) {
        tasks.push({
          taskKey: `tax:consumption-final:${fiscalYearLabel}`,
          category: TAX_CATEGORY,
          title: "消費税（確定申告・納付）",
          dueDate: adjustToNextBusinessDay(addMonthsClampedUtc(fiscalYearEnd, 2), holidays),
          periodStart: fiscalYearStart,
          periodEnd: fiscalYearEnd,
        });

        const periods =
          consumptionInterimCount === 1 ? [6] : consumptionInterimCount === 3 ? [3, 6, 9] : Array.from({ length: 11 }, (_, i) => i + 1);
        periods.slice(0, consumptionInterimCount).forEach((months, idx) => {
          const periodAnchor = addMonthsUtc(fiscalYearStart, months);
          const periodEndDate = endOfMonthUtc(periodAnchor.getUTCFullYear(), periodAnchor.getUTCMonth() + 1);
          tasks.push({
            taskKey: `tax:consumption-interim:${consumptionInterimCount}x:${fiscalYearLabel}:${idx + 1}`,
            category: TAX_CATEGORY,
            title:
              consumptionInterimCount === 1
                ? "消費税（中間申告・予定納付：年1回）"
                : `消費税（中間申告・予定納付：年${consumptionInterimCount}回 第${idx + 1}回）`,
            dueDate: adjustToNextBusinessDay(addMonthsClampedUtc(periodEndDate, 2), holidays),
            periodStart: fiscalYearStart,
            periodEnd: periodEndDate,
          });
        });
      }
    } else {
      const yearStart = toUtcDateOnly(year, 1, 1);
      const yearEnd = toUtcDateOnly(year, 12, 31);
      tasks.push({
        taskKey: `tax:sole-income-final:${year}`,
        category: TAX_CATEGORY,
        title: "所得税（確定申告・納付）",
        dueDate: adjustToNextBusinessDay(toUtcDateOnly(year, 3, 15), holidays),
        periodStart: yearStart,
        periodEnd: yearEnd,
      });

      if (isTaxableBusiness) {
        tasks.push({
          taskKey: `tax:sole-consumption-final:${year}`,
          category: TAX_CATEGORY,
          title: "消費税（確定申告・納付）",
          dueDate: adjustToNextBusinessDay(toUtcDateOnly(year, 3, 31), holidays),
          periodStart: yearStart,
          periodEnd: yearEnd,
        });

        const periods =
          consumptionInterimCount === 1 ? [6] : consumptionInterimCount === 3 ? [3, 6, 9] : Array.from({ length: 11 }, (_, i) => i + 1);
        periods.slice(0, consumptionInterimCount).forEach((months, idx) => {
          const periodEndDate = addDaysUtc(addMonthsUtc(yearStart, months), -1);
          tasks.push({
            taskKey: `tax:sole-consumption-interim:${consumptionInterimCount}x:${year}:${idx + 1}`,
            category: TAX_CATEGORY,
            title:
              consumptionInterimCount === 1
                ? "消費税（中間申告・予定納付：年1回）"
                : `消費税（中間申告・予定納付：年${consumptionInterimCount}回 第${idx + 1}回）`,
            dueDate: adjustToNextBusinessDay(addMonthsClampedUtc(periodEndDate, 2), holidays),
            periodStart: yearStart,
            periodEnd: periodEndDate,
          });
        });
      }
    }
  }

  return tasks.filter((task) => task.dueDate >= today);
}
