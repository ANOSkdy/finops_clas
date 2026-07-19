import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { todayInTokyo } from "@/lib/date/business-date";
import { JAPAN_PUBLIC_HOLIDAYS } from "@/lib/date/japan-holidays";
import { CURRENT_SCHEDULE_RULE_VERSION, generateSchedule, LEGACY_SCHEDULE_RULE_VERSION } from "./generate";

function selectedRule() {
  const configured = process.env.SCHEDULE_RULE_VERSION;
  if (!configured || configured === CURRENT_SCHEDULE_RULE_VERSION) {
    return { version: CURRENT_SCHEDULE_RULE_VERSION, holidays: JAPAN_PUBLIC_HOLIDAYS };
  }
  if (configured === LEGACY_SCHEDULE_RULE_VERSION) {
    return { version: LEGACY_SCHEDULE_RULE_VERSION, holidays: new Set<string>() };
  }
  throw new Error("Unsupported SCHEDULE_RULE_VERSION");
}

export async function syncGeneratedTasks(companyId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const company = await tx.company.findUniqueOrThrow({
      where: { id: companyId },
      include: { taxSetting: true, recurringTaxDueDates: true }
    });
    const tax = company.taxSetting ?? {
      isTaxable: false,
      withholdingSpecial: false,
      residentTaxSpecial: false,
      previousCorporateTaxYen: null,
      previousConsumptionTaxYen: null
    };
    const rule = selectedRule();
    const tasks = generateSchedule(company, tax, company.recurringTaxDueDates, todayInTokyo(), 36, rule.holidays, rule.version);
    if (tasks.length > 0) {
      const values = tasks.map((item) => Prisma.sql`(
        gen_random_uuid(),
        ${companyId}::uuid,
        ${item.taskKey},
        ${item.title},
        ${item.category},
        ${item.dueDate}::date,
        ${item.periodStart ?? null}::date,
        ${item.periodEnd ?? null}::date,
        'pending',
        TRUE,
        ${item.ruleVersion},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )`);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "tasks" (
          "id",
          "company_id",
          "task_key",
          "title",
          "category",
          "due_date",
          "period_start",
          "period_end",
          "status",
          "generated",
          "rule_version",
          "created_at",
          "updated_at"
        )
        VALUES ${Prisma.join(values)}
        ON CONFLICT ("company_id", "task_key") DO UPDATE SET
          "title" = EXCLUDED."title",
          "category" = EXCLUDED."category",
          "due_date" = EXCLUDED."due_date",
          "period_start" = EXCLUDED."period_start",
          "period_end" = EXCLUDED."period_end",
          "generated" = TRUE,
          "rule_version" = EXCLUDED."rule_version",
          "updated_at" = CURRENT_TIMESTAMP
      `);
    }
    const taskKeys = tasks.map((item) => item.taskKey);
    const removed = await tx.task.deleteMany({
      where: {
        companyId,
        status: { in: ["pending", "overdue"] },
        OR: [
          { generated: true, taskKey: { notIn: taskKeys } },
          { generated: false, ruleVersion: "legacy-neon", taskKey: { startsWith: "tax:" } },
          { generated: false, ruleVersion: "legacy-neon", taskKey: { startsWith: "social:" } }
        ]
      }
    });
    await tx.company.update({ where: { id: companyId }, data: { scheduleDirtyAt: null } });
    await tx.auditLog.create({ data: { companyId, actorUserId, action: "schedule.refresh", entityType: "Task", result: "success", metadata: { generated: tasks.length, removed: removed.count } } });
    return { generated: tasks.length, removed: removed.count };
  }, { maxWait: 10_000, timeout: 15_000 });
}
