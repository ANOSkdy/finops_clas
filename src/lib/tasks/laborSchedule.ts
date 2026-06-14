import { addMonthsUtc, adjustToNextBusinessDay, startOfUtcDay, toUtcDateOnly } from "@/lib/date/businessDay";
import type { GeneratedTask } from "@/lib/tasks/taxSchedule";

const LABOR_CATEGORY: GeneratedTask["category"] = "social";

function isWithinWindow(dueDate: Date, today: Date, endDate: Date): boolean {
  return dueDate >= today && dueDate <= endDate;
}

export function generateLaborScheduleTasks(input: {
  fromDate?: Date;
  monthsAhead?: number;
  holidays?: Set<string>;
} = {}): GeneratedTask[] {
  const today = startOfUtcDay(input.fromDate ?? new Date());
  const monthsAhead = input.monthsAhead ?? 36;
  const endDate = addMonthsUtc(today, monthsAhead);
  const tasks: GeneratedTask[] = [];

  for (let year = today.getUTCFullYear(); year <= endDate.getUTCFullYear(); year += 1) {
    const annualSocialInsuranceBasisDueDate = adjustToNextBusinessDay(toUtcDateOnly(year, 7, 10), input.holidays);
    if (isWithinWindow(annualSocialInsuranceBasisDueDate, today, endDate)) {
      tasks.push({
        taskKey: `social:standard:annual-social-insurance-basis:${year}`,
        category: LABOR_CATEGORY,
        title: "算定基礎届",
        dueDate: annualSocialInsuranceBasisDueDate,
        periodStart: toUtcDateOnly(year, 4, 1),
        periodEnd: toUtcDateOnly(year, 6, 30),
      });
    }

    const laborInsuranceRenewalDueDate = adjustToNextBusinessDay(toUtcDateOnly(year, 7, 10), input.holidays);
    if (isWithinWindow(laborInsuranceRenewalDueDate, today, endDate)) {
      tasks.push({
        taskKey: `social:standard:labor-insurance-renewal:${year}`,
        category: LABOR_CATEGORY,
        title: "労働保険年度更新",
        dueDate: laborInsuranceRenewalDueDate,
        periodStart: toUtcDateOnly(year - 1, 4, 1),
        periodEnd: toUtcDateOnly(year, 3, 31),
      });
    }
  }

  // TODO: 賞与支払届は賞与支給日の会社設定が追加された後に生成対象へ含める。
  return tasks;
}
