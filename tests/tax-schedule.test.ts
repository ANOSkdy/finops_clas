import assert from "node:assert/strict";
import test from "node:test";
import { generateSchedule, type ScheduleTax } from "../src/lib/tasks/generate";

const defaultTax: ScheduleTax = { isTaxable: true, withholdingSpecial: false, residentTaxSpecial: false, previousCorporateTaxYen: null, previousConsumptionTaxYen: null };

test("generates a 36 month schedule with stable unique task keys", () => {
  const tasks = generateSchedule({ legalForm: "corporation", closingMonth: 3 }, defaultTax, [], "2026-07-17" as never);
  assert.ok(tasks.length > 70);
  assert.equal(new Set(tasks.map((task) => task.taskKey)).size, tasks.length);
  assert.ok(tasks.every((task) => task.dueDate >= "2026-07-17" && task.dueDate <= "2029-07-17"));
});

test("withholding special rule replaces monthly withholding tasks", () => {
  const tasks = generateSchedule({ legalForm: "corporation", closingMonth: 3 }, { ...defaultTax, withholdingSpecial: true }, [], "2026-01-01" as never, 12);
  assert.equal(tasks.some((task) => task.taskKey.startsWith("withholding-monthly")), false);
  assert.equal(tasks.some((task) => task.taskKey.startsWith("withholding-special")), true);
});

test("July closing corporation final deadline is September month end", () => {
  const tasks = generateSchedule({ legalForm: "corporation", closingMonth: 7 }, defaultTax, [], "2026-01-01" as never, 24);
  assert.ok(tasks.some((task) => task.taskKey === "corporate-final-2026:2026-09-30"));
});

test("standard task wins over visually identical recurring tax due date", () => {
  const tasks = generateSchedule({ legalForm: "corporation", closingMonth: 3 }, defaultTax, [{ id: "custom", title: "法定調書・給与支払報告書", taxType: "tax", installmentLabel: null, month: 1, day: 31, enabled: true }], "2026-01-01" as never, 12);
  const matches = tasks.filter((task) => task.title === "法定調書・給与支払報告書" && task.dueDate === "2026-02-02");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].taskKey.startsWith("statutory-report"), true);
});
