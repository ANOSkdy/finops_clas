"use client";

type Task = {
  taskId: string;
  category: "tax" | "social" | "other";
  title: string;
  dueDate: string; // YYYY-MM-DD
  status: "pending" | "done" | "overdue";
};

function Badge({ status }: { status: Task["status"] }) {
  const base = "rounded-full border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-ink";

  if (status === "done") return <span className={base}>完了</span>;
  if (status === "overdue") return <span className={base}>期限切れ</span>;
  return <span className={base}>未完</span>;
}

function Section({ title, items }: { title: string; items: Task[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold tracking-wide text-inkMuted">{title}</div>

      <ul className="space-y-2">
        {items.map((t) => (
          <li
            key={t.taskId}
            className="rounded-2xl border border-line bg-white/85 shadow-softSm px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-ink">{t.title}</div>
                <div className="mt-1 text-xs text-inkMuted">期限: {t.dueDate}</div>
              </div>
              <Badge status={t.status} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const tax = tasks.filter((t) => t.category === "tax");
  const social = tasks.filter((t) => t.category === "social");
  const other = tasks.filter((t) => t.category === "other");

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white/85 shadow-softSm px-4 py-6 text-sm text-ink">
        タスクがまだありません。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="税務" items={tax} />
      <Section title="社会保険" items={social} />
      <Section title="その他" items={other} />
    </div>
  );
}
