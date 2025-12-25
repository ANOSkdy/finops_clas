import assert from "node:assert/strict";
import test from "node:test";
import { generateTasksForCompany } from "../generator";

test("generateTasksForCompany creates system tasks with required fields", async () => {
  const created: any[] = [];
  const tx: any = {
    company: {
      findUniqueOrThrow: async () => ({
        id: "company-1",
        legalForm: "corporation",
        fiscalClosingMonth: 3,
        withholdingIncomeTaxPaymentSchedule: "special",
        residentTaxPaymentSchedule: "monthly",
      }),
    },
    task: {
      createMany: async ({ data }: any) => {
        created.push(...data);
        return { count: data.length };
      },
    },
  };

  await generateTasksForCompany(tx, "company-1", { horizonMonths: 6 });

  assert.ok(created.length > 0);
  for (const t of created) {
    assert.equal(t.companyId, "company-1");
    assert.equal(t.source, "system");
    assert.equal(t.status, "pending");
    assert.equal(typeof t.templateKey, "string");
    assert.equal(typeof t.templateVersion, "number");
    assert.equal(t.archivedAt, null);
    assert.ok(t.dueDate instanceof Date);
  }
});
