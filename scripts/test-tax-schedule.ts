import assert from "node:assert/strict";
import { addMonthsClampedUtc, toUtcDateOnly } from "../src/lib/date/businessDay";
import { dedupeGeneratedTasks } from "../src/lib/tasks/syncGeneratedTasks";
import { generateTaxScheduleTasks, type GeneratedTask } from "../src/lib/tasks/taxSchedule";

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

assert.equal(iso(addMonthsClampedUtc(toUtcDateOnly(2026, 7, 31), 2)), "2026-09-30");

const specialWithholdingTasks = generateTaxScheduleTasks({
  company: {
    legalForm: "corporation",
    fiscalClosingMonth: 12,
    withholdingIncomeTaxPaymentSchedule: "special",
    residentTaxPaymentSchedule: "monthly",
  },
  fromDate: toUtcDateOnly(2026, 1, 1),
  monthsAhead: 12,
});
assert.equal(
  specialWithholdingTasks.some((task) => task.taskKey.startsWith("tax:withholding:monthly:")),
  false,
);

const julyClosingTasks = generateTaxScheduleTasks({
  company: {
    legalForm: "corporation",
    fiscalClosingMonth: 7,
    withholdingIncomeTaxPaymentSchedule: "monthly",
    residentTaxPaymentSchedule: "monthly",
  },
  fromDate: toUtcDateOnly(2026, 1, 1),
  monthsAhead: 24,
});
const corporateFinal2026 = julyClosingTasks.find((task) => task.taskKey === "tax:corporate-final:2026-07");
assert.ok(corporateFinal2026);
assert.equal(iso(corporateFinal2026.dueDate), "2026-09-30");

const standardTask: GeneratedTask = {
  taskKey: "tax:withholding:monthly:2026-02",
  category: "tax",
  title: "源泉所得税・復興特別所得税（毎月納付）",
  dueDate: toUtcDateOnly(2026, 2, 10),
};
const recurringTask: GeneratedTask = {
  ...standardTask,
  taskKey: "tax:recurring:withholding:setting-id:2026",
};
const deduped = dedupeGeneratedTasks({ standardTasks: [standardTask], recurringTasks: [recurringTask] });
assert.deepEqual(deduped.map((task) => task.taskKey), [standardTask.taskKey]);
