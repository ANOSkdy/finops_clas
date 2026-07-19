import { addMonths, endOfMonth, fromDateUtc, nextBusinessDay, toUtcDate, type DateOnly } from "@/lib/date/business-date";
import { JAPAN_HOLIDAY_CALENDAR, JAPAN_PUBLIC_HOLIDAYS } from "@/lib/date/japan-holidays";

export const CURRENT_SCHEDULE_RULE_VERSION = `clas-${JAPAN_HOLIDAY_CALENDAR.version}` as const;
export const LEGACY_SCHEDULE_RULE_VERSION = "clas-asis-1" as const;
export type ScheduleRuleVersion = typeof CURRENT_SCHEDULE_RULE_VERSION | typeof LEGACY_SCHEDULE_RULE_VERSION;

export type GeneratedTask = {
  taskKey: string;
  title: string;
  category: "tax" | "labor" | "other";
  dueDate: DateOnly;
  periodStart?: DateOnly;
  periodEnd?: DateOnly;
  ruleVersion: ScheduleRuleVersion;
};

export type ScheduleCompany = { legalForm: string; closingMonth: number };
export type ScheduleTax = {
  isTaxable: boolean;
  withholdingSpecial: boolean;
  residentTaxSpecial: boolean;
  previousCorporateTaxYen: bigint | null;
  previousConsumptionTaxYen: bigint | null;
};
export type RecurringDue = { id: string; title: string; taxType: string; installmentLabel: string | null; month: number; day: number; enabled: boolean };

function date(year: number, month: number, day: number): DateOnly {
  return fromDateUtc(new Date(Date.UTC(year, month - 1, day)));
}

function within(taskDate: DateOnly, start: DateOnly, end: DateOnly) {
  return taskDate >= start && taskDate <= end;
}

export function generateSchedule(
  company: ScheduleCompany,
  tax: ScheduleTax,
  recurring: readonly RecurringDue[],
  start: DateOnly,
  months = 36,
  holidays: ReadonlySet<string> = JAPAN_PUBLIC_HOLIDAYS,
  ruleVersion: ScheduleRuleVersion = CURRENT_SCHEDULE_RULE_VERSION
) {
  const end = addMonths(start, months);
  const startYear = Number(start.slice(0, 4));
  const endYear = Number(end.slice(0, 4));
  const generated: GeneratedTask[] = [];
  const adjusted = (value: DateOnly) => nextBusinessDay(value, holidays);
  const makeTask = (key: string, title: string, category: GeneratedTask["category"], dueDate: DateOnly, periodStart?: DateOnly, periodEnd?: DateOnly): GeneratedTask => ({
    taskKey: `${key}:${dueDate}`,
    title,
    category,
    dueDate,
    periodStart,
    periodEnd,
    ruleVersion
  });

  for (let offset = 0; offset <= months; offset += 1) {
    const monthStart = addMonths(`${start.slice(0, 7)}-01` as DateOnly, offset, 1);
    const year = Number(monthStart.slice(0, 4));
    const month = Number(monthStart.slice(5, 7));
    const nextDue = adjusted(addMonths(monthStart, 1, 10));
    if (!tax.withholdingSpecial) generated.push(makeTask(`withholding-monthly-${year}-${month}`, "源泉所得税・復興特別所得税", "tax", nextDue, monthStart, endOfMonth(year, month)));
    if (!tax.residentTaxSpecial) generated.push(makeTask(`resident-monthly-${year}-${month}`, "住民税特別徴収", "tax", nextDue, monthStart, endOfMonth(year, month)));
  }

  for (let year = startYear - 1; year <= endYear + 1; year += 1) {
    if (tax.withholdingSpecial) {
      generated.push(makeTask(`withholding-special-h1-${year}`, "源泉所得税・復興特別所得税（納期の特例・1〜6月分）", "tax", adjusted(date(year, 7, 10)), date(year, 1, 1), date(year, 6, 30)));
      generated.push(makeTask(`withholding-special-h2-${year}`, "源泉所得税・復興特別所得税（納期の特例・7〜12月分）", "tax", adjusted(date(year + 1, 1, 20)), date(year, 7, 1), date(year, 12, 31)));
    }
    if (tax.residentTaxSpecial) {
      generated.push(makeTask(`resident-special-h1-${year}`, "住民税特別徴収（納期の特例・12〜5月分）", "tax", adjusted(date(year, 6, 10)), date(year - 1, 12, 1), date(year, 5, 31)));
      generated.push(makeTask(`resident-special-h2-${year}`, "住民税特別徴収（納期の特例・6〜11月分）", "tax", adjusted(date(year, 12, 10)), date(year, 6, 1), date(year, 11, 30)));
    }
    generated.push(makeTask(`statutory-report-${year}`, "法定調書・給与支払報告書", "tax", adjusted(date(year, 1, 31))));
    generated.push(makeTask(`labor-basis-${year}`, "算定基礎届", "labor", adjusted(date(year, 7, 10)), date(year, 4, 1), date(year, 6, 30)));
    generated.push(makeTask(`labor-insurance-${year}`, "労働保険年度更新", "labor", adjusted(date(year, 7, 10)), date(year - 1, 4, 1), date(year, 3, 31)));

    if (company.legalForm === "sole_proprietor") {
      generated.push(makeTask(`income-final-${year}`, "所得税確定申告", "tax", adjusted(date(year, 3, 15)), date(year, 1, 1), date(year, 12, 31)));
      if (tax.isTaxable) generated.push(makeTask(`consumption-sole-final-${year}`, "消費税確定申告", "tax", adjusted(date(year, 3, 31)), date(year, 1, 1), date(year, 12, 31)));
    } else {
      const fiscalEnd = endOfMonth(year, company.closingMonth);
      const finalDue = adjusted(addMonths(fiscalEnd, 2));
      const fiscalStart = addMonths(fiscalEnd, -11, 1);
      generated.push(makeTask(`corporate-final-${year}`, "法人税・地方税確定申告", "tax", finalDue, fiscalStart, fiscalEnd));
      if (tax.isTaxable) generated.push(makeTask(`consumption-corporate-final-${year}`, "法人消費税確定申告", "tax", finalDue, fiscalStart, fiscalEnd));
      if ((tax.previousCorporateTaxYen ?? 0n) > 200_000n) {
        const interimEnd = endOfMonth(toUtcDate(fiscalStart).getUTCFullYear(), toUtcDate(fiscalStart).getUTCMonth() + 7);
        generated.push(makeTask(`corporate-interim-${year}`, "法人税・地方税中間申告", "tax", adjusted(addMonths(interimEnd, 2)), fiscalStart, interimEnd));
      }
    }

    for (const item of recurring) {
      if (!item.enabled) continue;
      const base = date(year, item.month, Math.min(item.day, toUtcDate(endOfMonth(year, item.month)).getUTCDate()));
      const label = item.installmentLabel ? `（${item.installmentLabel}）` : "";
      generated.push(makeTask(`recurring-${item.id}-${year}`, `${item.title}${label}`, "tax", adjusted(base)));
    }
  }

  const standardFingerprints = new Set(generated.filter((item) => !item.taskKey.startsWith("recurring-")).map((item) => `${item.category}|${item.title}|${item.dueDate}`));
  const byKey = new Map<string, GeneratedTask>();
  for (const item of generated) {
    if (!within(item.dueDate, start, end)) continue;
    if (item.taskKey.startsWith("recurring-") && standardFingerprints.has(`${item.category}|${item.title}|${item.dueDate}`)) continue;
    byKey.set(item.taskKey, item);
  }
  return [...byKey.values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title, "ja"));
}
