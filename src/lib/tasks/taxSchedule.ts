import {
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

const TAX_CATEGORY: GeneratedTask["category"] = "tax";

function monthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function generateTaxScheduleTasks(input: {
  company: TaxScheduleCompanyInput;
  fromDate?: Date;
  monthsAhead?: number;
  holidays?: Set<string>;
}): GeneratedTask[] {
  const { company, holidays } = input;
  const monthsAhead = input.monthsAhead ?? 36;
  const today = startOfUtcDay(input.fromDate ?? new Date());
  const fromMonth = toUtcDateOnly(today.getUTCFullYear(), today.getUTCMonth() + 1, 1);

  const tasks: GeneratedTask[] = [];
  const withholdingSpecial = company.withholdingIncomeTaxPaymentSchedule === "special";
  const residentTaxSpecial = company.residentTaxPaymentSchedule === "special";

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

    const isCorporation = company.legalForm !== "sole";
    if (isCorporation) {
      const fiscalClosingMonth = company.fiscalClosingMonth ?? 12;
      const fiscalYearEnd = endOfMonthUtc(year, fiscalClosingMonth);
      const corporateDueDate = adjustToNextBusinessDay(addMonthsUtc(fiscalYearEnd, 2), holidays);

      tasks.push({
        taskKey: `tax:corporate-final:${year}-${String(fiscalClosingMonth).padStart(2, "0")}`,
        category: TAX_CATEGORY,
        title: "法人税・地方税（確定申告・納付）",
        dueDate: corporateDueDate,
      });
    }
  }

  return tasks.filter((task) => task.dueDate >= today);
}
