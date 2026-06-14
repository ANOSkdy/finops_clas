import type { Prisma, PrismaClient } from "@prisma/client";
import type { GeneratedTask } from "@/lib/tasks/taxSchedule";

type TaskClient = PrismaClient | Prisma.TransactionClient;

type GeneratedTaskWithSource = GeneratedTask & { source: "standard" | "recurring" };

const ACTIVE_GENERATED_STATUSES = ["pending", "overdue"];

const LEGACY_GENERATED_TAX_TITLES = [
  "源泉所得税・復興特別所得税（毎月納付）",
  "住民税（特別徴収）納入（毎月）",
  "源泉所得税・復興特別所得税（納期の特例：1〜6月分）",
  "源泉所得税・復興特別所得税（納期の特例：7〜12月分）",
  "住民税（特別徴収）納入（納期の特例：12〜5月分）",
  "住民税（特別徴収）納入（納期の特例：6〜11月分）",
  "法定調書・給与支払報告書・償却資産申告（提出期限）",
  "法人税・地方税（確定申告・納付）",
  "法人税・地方税（予定納税・中間申告）",
  "消費税（確定申告・納付）",
  "消費税（中間申告・予定納付：年1回）",
  "消費税（中間申告・予定納付：年3回 第1回）",
  "消費税（中間申告・予定納付：年3回 第2回）",
  "消費税（中間申告・予定納付：年3回 第3回）",
  ...Array.from({ length: 11 }, (_, i) => `消費税（中間申告・予定納付：年11回 第${i + 1}回）`),
  "所得税（確定申告・納付）",
];

function dueDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function visibleTaskKey(task: { category: string; title: string; dueDate: Date }): string {
  return [task.category, task.title, dueDateKey(task.dueDate)].join("\u0000");
}

async function deleteLegacyGeneratedTaxTasks(input: {
  tx: TaskClient;
  companyId: string;
  currentVisibleKeys: Set<string>;
}) {
  const legacyCandidates = await input.tx.task.findMany({
    where: {
      companyId: input.companyId,
      category: "tax",
      status: { in: ACTIVE_GENERATED_STATUSES },
      taskKey: null,
      title: { in: LEGACY_GENERATED_TAX_TITLES },
    },
    select: { id: true, category: true, title: true, dueDate: true },
  });

  const staleLegacyIds = legacyCandidates
    .filter((task) => !input.currentVisibleKeys.has(visibleTaskKey(task)))
    .map((task) => task.id);

  if (staleLegacyIds.length === 0) return;

  await input.tx.task.deleteMany({
    where: {
      companyId: input.companyId,
      id: { in: staleLegacyIds },
      status: { in: ACTIVE_GENERATED_STATUSES },
      taskKey: null,
    },
  });
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
  taskKeyPrefixes?: string[];
}) {
  const taskKeys = input.tasks.map((task) => task.taskKey);
  const taskKeyPrefixes = input.taskKeyPrefixes ?? ["tax:"];
  const currentVisibleKeys = new Set(input.tasks.map(visibleTaskKey));

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
          notIn: taskKeys.length > 0 ? taskKeys : ["__never_generated__"],
        },
        OR: taskKeyPrefixes.map((prefix) => ({ taskKey: { startsWith: prefix } })),
      },
    });

    await deleteLegacyGeneratedTaxTasks({
      tx,
      companyId: input.companyId,
      currentVisibleKeys,
    });

    await cleanupDuplicateGeneratedTasks(tx, input.companyId);
  });
}
