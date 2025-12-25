import {
  addMonthsUTC,
  endOfMonthUTC,
  monthIterUTC,
  shiftWeekendToNextWeekdayUTC,
  utcDate,
} from "./date";

export type CompanyProfile = {
  id: string;
  legalForm: "corporation" | "sole";
  fiscalClosingMonth: number; // 1-12
  withholdingSchedule: "monthly" | "special";
  residentSchedule: "monthly" | "special";
  locationCode?: string | null;
};

export type GenerateWindow = { from: Date; to: Date };

export type TaskOccurrence = { dueDate: Date; meta?: unknown };

export type TaskTemplate = {
  key: string;
  version: number;
  category: "tax" | "social" | "other";
  title: (c: CompanyProfile) => string;
  applies: (c: CompanyProfile) => boolean;
  occurrences: (c: CompanyProfile, w: GenerateWindow) => TaskOccurrence[];
};

function fiscalYearEndDateUTC(company: CompanyProfile, anchorYear: number): Date {
  // Fiscal year ends on the last day of the configured month in anchorYear.
  const month = company.fiscalClosingMonth;
  return utcDate(anchorYear, month + 1, 0);
}

function computeFilingDueUTC(fiscalYearEnd: Date): Date {
  // Filing deadline: end of month, two months after fiscal year end (rough statutory baseline).
  const plus2 = addMonthsUTC(fiscalYearEnd, 2);
  const eom = endOfMonthUTC(plus2);
  return shiftWeekendToNextWeekdayUTC(eom);
}

function inWindow(d: Date, w: GenerateWindow): boolean {
  return d.getTime() >= w.from.getTime() && d.getTime() <= w.to.getTime();
}

/**
 * MVP task templates (Phase 1):
 * - Withholding tax: monthly (next month 10th) OR special (Jan 20 / Jul 10)
 * - Resident tax (special collection): monthly 10th OR special (Jun 10 / Dec 10)
 * - Annual Jan 31 batch: statutory statements, salary reports, depreciable assets
 * - Fiscal-year end driven: corporate/local tax filings due 2 months after FY end (EOM, weekday-shift)
 */
export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: "tax_withholding_monthly",
    version: 1,
    category: "tax",
    title: () => "源泉所得税・復興特別所得税（毎月納付）",
    applies: (c) => c.withholdingSchedule === "monthly",
    occurrences: (_c, w) => {
      return monthIterUTC(w.from, w.to)
        .map((mStart) => {
          const next = addMonthsUTC(mStart, 1);
          const due = shiftWeekendToNextWeekdayUTC(utcDate(next.getUTCFullYear(), next.getUTCMonth() + 1, 10));
          return { dueDate: due, meta: { period: `${mStart.getUTCFullYear()}-${mStart.getUTCMonth() + 1}` } };
        })
        .filter((o) => inWindow(o.dueDate, w));
    },
  },
  {
    key: "tax_withholding_special_jul",
    version: 1,
    category: "tax",
    title: () => "源泉所得税・復興特別所得税（納期の特例：1〜6月分）",
    applies: (c) => c.withholdingSchedule === "special",
    occurrences: (_c, w) => {
      const years = new Set<number>();
      for (const m of monthIterUTC(w.from, w.to)) years.add(m.getUTCFullYear());
      const res: TaskOccurrence[] = [];
      for (const y of years) {
        const due = shiftWeekendToNextWeekdayUTC(utcDate(y, 7, 10));
        if (inWindow(due, w)) res.push({ dueDate: due, meta: { range: "1-6" } });
      }
      return res;
    },
  },
  {
    key: "tax_withholding_special_jan",
    version: 1,
    category: "tax",
    title: () => "源泉所得税・復興特別所得税（納期の特例：7〜12月分）",
    applies: (c) => c.withholdingSchedule === "special",
    occurrences: (_c, w) => {
      const years = new Set<number>();
      for (const m of monthIterUTC(w.from, w.to)) years.add(m.getUTCFullYear());
      const res: TaskOccurrence[] = [];
      for (const y of years) {
        const due = shiftWeekendToNextWeekdayUTC(utcDate(y, 1, 20));
        if (inWindow(due, w)) res.push({ dueDate: due, meta: { range: "7-12(prev)" } });
      }
      return res;
    },
  },
  {
    key: "tax_resident_monthly",
    version: 1,
    category: "tax",
    title: () => "住民税（特別徴収）納入（毎月）",
    applies: (c) => c.residentSchedule === "monthly",
    occurrences: (_c, w) => {
      return monthIterUTC(w.from, w.to)
        .map((mStart) => {
          const next = addMonthsUTC(mStart, 1);
          const due = shiftWeekendToNextWeekdayUTC(utcDate(next.getUTCFullYear(), next.getUTCMonth() + 1, 10));
          return { dueDate: due, meta: { period: `${mStart.getUTCFullYear()}-${mStart.getUTCMonth() + 1}` } };
        })
        .filter((o) => inWindow(o.dueDate, w));
    },
  },
  {
    key: "tax_resident_special_jun",
    version: 1,
    category: "tax",
    title: () => "住民税（特別徴収）納入（納期の特例：12〜5月分）",
    applies: (c) => c.residentSchedule === "special",
    occurrences: (_c, w) => {
      const years = new Set<number>();
      for (const m of monthIterUTC(w.from, w.to)) years.add(m.getUTCFullYear());
      const res: TaskOccurrence[] = [];
      for (const y of years) {
        const due = shiftWeekendToNextWeekdayUTC(utcDate(y, 6, 10));
        if (inWindow(due, w)) res.push({ dueDate: due, meta: { range: "12-5" } });
      }
      return res;
    },
  },
  {
    key: "tax_resident_special_dec",
    version: 1,
    category: "tax",
    title: () => "住民税（特別徴収）納入（納期の特例：6〜11月分）",
    applies: (c) => c.residentSchedule === "special",
    occurrences: (_c, w) => {
      const years = new Set<number>();
      for (const m of monthIterUTC(w.from, w.to)) years.add(m.getUTCFullYear());
      const res: TaskOccurrence[] = [];
      for (const y of years) {
        const due = shiftWeekendToNextWeekdayUTC(utcDate(y, 12, 10));
        if (inWindow(due, w)) res.push({ dueDate: due, meta: { range: "6-11" } });
      }
      return res;
    },
  },
  {
    key: "tax_filing_corporate",
    version: 1,
    category: "tax",
    title: () => "法人税・地方税（確定申告・納付）",
    applies: (c) => c.legalForm === "corporation",
    occurrences: (c, w) => {
      const years = new Set<number>();
      for (const m of monthIterUTC(w.from, w.to)) years.add(m.getUTCFullYear());
      const res: TaskOccurrence[] = [];
      for (const y of years) {
        const fyEnd = fiscalYearEndDateUTC(c, y);
        const due = computeFilingDueUTC(fyEnd);
        if (inWindow(due, w)) {
          res.push({ dueDate: due, meta: { fiscalYearEnd: fyEnd.toISOString().slice(0, 10) } });
        }
      }
      return res;
    },
  },
  {
    key: "annual_statements_jan31",
    version: 1,
    category: "tax",
    title: () => "法定調書・給与支払報告書・償却資産申告（提出期限）",
    applies: (_c) => true,
    occurrences: (_c, w) => {
      const years = new Set<number>();
      for (const m of monthIterUTC(w.from, w.to)) years.add(m.getUTCFullYear());
      const res: TaskOccurrence[] = [];
      for (const y of years) {
        const due = shiftWeekendToNextWeekdayUTC(utcDate(y, 1, 31));
        if (inWindow(due, w)) res.push({ dueDate: due });
      }
      return res;
    },
  },
];
