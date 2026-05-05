"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";

type Task = {
  taskId: string;
  category: "tax" | "social" | "other";
  title: string;
  dueDate: string;
  status: "pending" | "done" | "overdue";
};

function Badge({ status }: { status: Task["status"] }) {
  if (status === "done") return <StatusBadge tone="success">完了</StatusBadge>;
  if (status === "overdue") return <StatusBadge tone="danger">期限切れ</StatusBadge>;
  return <StatusBadge tone="primary">未完</StatusBadge>;
}

function Section({ title, items }: { title: string; items: Task[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold leading-5 text-ink">{title}</div>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <li key={t.taskId} className="rounded-xl border border-line bg-panel px-4 py-3 shadow-softSm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-5 text-ink">{t.title}</div>
                <div className="mt-1 text-xs leading-4 text-inkMuted">期限: {t.dueDate}</div>
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
    return <div className="rounded-xl border border-line bg-panel px-4 py-6 text-sm text-inkMuted">タスクがまだありません。</div>;
  }

  return (
    <div className="space-y-6">
      <Section title="税務" items={tax} />
      <Section title="社会保険" items={social} />
      <Section title="その他" items={other} />
    </div>
  );
}
