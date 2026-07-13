"use client";

import { Card } from "@/components/ui/Card";

type Task = {
  taskId: string;
  category: "tax" | "social" | "other";
  title: string;
  dueDate: string; // YYYY-MM-DD
  status: "pending" | "done" | "overdue";
};

type TaskCategory = Task["category"];

type MonthlyTaskGroup = {
  monthKey: string;
  monthLabel: string;
  tasks: Task[];
};

const CATEGORY_SECTIONS: { category: TaskCategory; title: string; alwaysShow: boolean }[] = [
  { category: "tax", title: "【税務】", alwaysShow: true },
  { category: "social", title: "【労務】", alwaysShow: true },
  { category: "other", title: "【その他】", alwaysShow: false },
];

function Badge({ status }: { status: Task["status"] }) {
  const base =
    "inline-flex h-7 min-w-[52px] items-center justify-center whitespace-nowrap rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-2 text-[11px] font-medium leading-none text-[var(--color-text-primary)]";

  if (status === "done") return <span className={base}>完了</span>;
  if (status === "overdue") return <span className={base}>期限切れ</span>;
  return <span className={base}>未完</span>;
}

function getMonthKey(dueDate: string): string {
  return dueDate.slice(0, 7);
}

function getMonthLabel(monthKey: string): string {
  const month = Number(monthKey.slice(5, 7));
  return Number.isFinite(month) && month >= 1 && month <= 12 ? `${month}月` : monthKey;
}

function groupTasksByMonth(tasks: Task[]): MonthlyTaskGroup[] {
  const sortedTasks = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const groups = new Map<string, Task[]>();

  for (const task of sortedTasks) {
    const monthKey = getMonthKey(task.dueDate);
    const group = groups.get(monthKey) ?? [];
    group.push(task);
    groups.set(monthKey, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, monthlyTasks]) => ({
      monthKey,
      monthLabel: getMonthLabel(monthKey),
      tasks: monthlyTasks,
    }));
}

function TaskItems({
  items,
  onStatusChange,
  updatingTaskId,
}: {
  items: Task[];
  onStatusChange?: (taskId: string, status: "pending" | "done") => Promise<void> | void;
  updatingTaskId?: string | null;
}) {
  if (items.length === 0) {
    return <div className="rounded-2xl px-4 py-3 text-sm text-[var(--color-text-secondary)]">なし</div>;
  }

  return (
    <ul className="space-y-2">
      {items.map((t) => {
        const nextStatus = t.status === "done" ? "pending" : "done";
        const buttonLabel = t.status === "done" ? "未完に戻す" : "完了にする";
        return (
          <li key={t.taskId} className="rounded-2xl px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">{t.title}</div>
                <div className="mt-1 text-xs text-[var(--color-text-secondary)]">期限: {t.dueDate}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge status={t.status} />
                {onStatusChange && (
                  <button
                    type="button"
                    className="tap-44 rounded-xl border border-[var(--color-border-default)] px-3 text-xs text-[var(--color-text-primary)] disabled:opacity-50"
                    disabled={updatingTaskId === t.taskId}
                    onClick={() => onStatusChange(t.taskId, nextStatus)}
                  >
                    {buttonLabel}
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Section({
  title,
  items,
  onStatusChange,
  updatingTaskId,
}: {
  title: string;
  items: Task[];
  onStatusChange?: (taskId: string, status: "pending" | "done") => Promise<void> | void;
  updatingTaskId?: string | null;
}) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold tracking-wide text-[var(--color-text-secondary)]">{title}</div>
      <TaskItems items={items} onStatusChange={onStatusChange} updatingTaskId={updatingTaskId} />
    </section>
  );
}

export function TaskList({
  tasks,
  onStatusChange,
  updatingTaskId,
}: {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: "pending" | "done") => Promise<void> | void;
  updatingTaskId?: string | null;
}) {
  if (tasks.length === 0) {
    return <div className=" rounded-2xl px-4 py-6 text-sm text-[var(--color-text-primary)]">タスクがまだありません。</div>;
  }

  const monthlyGroups = groupTasksByMonth(tasks);

  return (
    <div className="space-y-6">
      {monthlyGroups.map((group) => (
        <Card key={group.monthKey} className="space-y-4 p-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{group.monthLabel}</h2>
          <div className="space-y-4">
            {CATEGORY_SECTIONS.map((section) => {
              const items = group.tasks.filter((task) => task.category === section.category);
              if (!section.alwaysShow && items.length === 0) return null;
              return (
                <Section
                  key={section.category}
                  title={section.title}
                  items={items}
                  onStatusChange={onStatusChange}
                  updatingTaskId={updatingTaskId}
                />
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
