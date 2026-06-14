import type { Prisma, PrismaClient } from "@prisma/client";
import type { GeneratedTask } from "@/lib/tasks/taxSchedule";

type TaskClient = PrismaClient | Prisma.TransactionClient;

type GeneratedTaskWithSource = GeneratedTask & { source: "standard" | "recurring" };

const ACTIVE_GENERATED_STATUSES = ["pending", "overdue"];

function dueDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function visibleTaskKey(task: GeneratedTask): string {
  return [task.category, task.title, dueDateKey(task.dueDate)].join("\u0000");
}

export function dedupeGeneratedTasks(input: {
  standardTasks: GeneratedTask[];
  recurringTasks: GeneratedTask[];
}): GeneratedTask[] {
  const byTaskKey = new Map<string, GeneratedTaskWithSource>();

  const addByTaskKey = (task: GeneratedTask, source: GeneratedTaskWithSource["source"]) => {
    const existing = byTaskKey.get(task.taskKey);
    if (!existing || (existing.source === "recurring" && source === "standard")) {
      byTaskKey.set(task.taskKey, { ...task, source });
    }
  };

  input.standardTasks.forEach((task) => addByTaskKey(task, "standard"));
  input.recurringTasks.forEach((task) => addByTaskKey(task, "recurring"));

  const byVisibleKey = new Map<string, GeneratedTaskWithSource>();
  for (const task of byTaskKey.values()) {
    const key = visibleTaskKey(task);
    const existing = byVisibleKey.get(key);
    if (!existing || (existing.source === "recurring" && task.source === "standard")) {
      byVisibleKey.set(key, task);
    }
  }

  return [...byVisibleKey.values()].map((task) => ({
    taskKey: task.taskKey,
    category: task.category,
    title: task.title,
    dueDate: task.dueDate,
    periodStart: task.periodStart,
    periodEnd: task.periodEnd,
  }));
}

async function cleanupDuplicateGeneratedTasks(tx: TaskClient, companyId: string) {
  await tx.$executeRaw`
    DELETE FROM "tasks" victim
    USING "tasks" keeper
    WHERE victim."company_id" = ${companyId}::uuid
      AND keeper."company_id" = victim."company_id"
      AND victim."status" IN ('pending', 'overdue')
      AND keeper."status" IN ('pending', 'overdue')
      AND victim."task_key" IS NOT NULL
      AND keeper."task_key" = victim."task_key"
      AND keeper."id" < victim."id"
  `;

  await tx.$executeRaw`
    DELETE FROM "tasks" victim
    USING "tasks" keeper
    WHERE victim."company_id" = ${companyId}::uuid
      AND keeper."company_id" = victim."company_id"
      AND victim."status" IN ('pending', 'overdue')
      AND keeper."status" IN ('pending', 'overdue')
      AND victim."task_key" IS NOT NULL
      AND keeper."task_key" IS NOT NULL
      AND keeper."category" = victim."category"
      AND keeper."title" = victim."title"
      AND keeper."due_date" = victim."due_date"
      AND keeper."id" < victim."id"
  `;
}

export async function syncGeneratedTaxTasks(input: {
  prisma: PrismaClient;
  companyId: string;
  tasks: GeneratedTask[];
}) {
  const taskKeys = input.tasks.map((task) => task.taskKey);

  await input.prisma.$transaction(async (tx) => {
    await cleanupDuplicateGeneratedTasks(tx, input.companyId);

    for (const task of input.tasks) {
      await tx.$executeRaw`
        INSERT INTO "tasks" (
          "company_id",
          "category",
          "title",
          "due_date",
          "task_key",
          "period_start",
          "period_end",
          "updated_at"
        ) VALUES (
          ${input.companyId}::uuid,
          ${task.category},
          ${task.title},
          ${task.dueDate},
          ${task.taskKey},
          ${task.periodStart ?? null},
          ${task.periodEnd ?? null},
          NOW()
        )
        ON CONFLICT ("company_id", "task_key")
        WHERE "task_key" IS NOT NULL
        DO UPDATE SET
          "category" = EXCLUDED."category",
          "title" = EXCLUDED."title",
          "due_date" = EXCLUDED."due_date",
          "period_start" = EXCLUDED."period_start",
          "period_end" = EXCLUDED."period_end",
          "updated_at" = NOW()
      `;
    }

    await tx.task.deleteMany({
      where: {
        companyId: input.companyId,
        status: { in: ACTIVE_GENERATED_STATUSES },
        taskKey: {
          startsWith: "tax:",
          notIn: taskKeys.length > 0 ? taskKeys : ["__never_generated__"],
        },
      },
    });

    await cleanupDuplicateGeneratedTasks(tx, input.companyId);
  });
}
