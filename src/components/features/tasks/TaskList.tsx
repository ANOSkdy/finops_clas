"use client";

type Task = {
  taskId: string;
  category: "tax" | "social" | "other";
  title: string;
  dueDate: string; // YYYY-MM-DD
  status: "pending" | "done" | "overdue";
};

function Badge({ status }: { status: Task["status"] }) {
  const base =
    "inline-flex h-7 min-w-[52px] items-center justify-center whitespace-nowrap rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-2 text-[11px] font-medium leading-none text-[var(--color-text-primary)]";

  if (status === "done") return <span className={base}>完了</span>;
  if (status === "overdue") return <span className={base}>期限切れ</span>;
  return <span className={base}>未完</span>;
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
  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold tracking-wide text-[var(--color-text-secondary)]">{title}</div>

      <ul className="space-y-2">
        {items.map((t) => {
          const nextStatus = t.status === "done" ? "pending" : "done";
          const buttonLabel = t.status === "done" ? "未完に戻す" : "完了にする";
          return (
            <li key={t.taskId} className=" rounded-2xl px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text-primary)]">{t.title}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-secondary)]">期限: {t.dueDate}</div>
                </div>
                <div className="flex items-center gap-2">
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
  const tax = tasks.filter((t) => t.category === "tax");
  const social = tasks.filter((t) => t.category === "social");
  const other = tasks.filter((t) => t.category === "other");

  if (tasks.length === 0) {
    return <div className=" rounded-2xl px-4 py-6 text-sm text-[var(--color-text-primary)]">タスクがまだありません。</div>;
  }

  return (
    <div className="space-y-6">
      <Section title="税務" items={tax} onStatusChange={onStatusChange} updatingTaskId={updatingTaskId} />
      <Section title="社会保険" items={social} onStatusChange={onStatusChange} updatingTaskId={updatingTaskId} />
      <Section title="その他" items={other} onStatusChange={onStatusChange} updatingTaskId={updatingTaskId} />
    </div>
  );
}
