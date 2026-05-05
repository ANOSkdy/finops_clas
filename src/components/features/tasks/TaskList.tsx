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
  if (status === "done") return <StatusBadge tone="success" className="w-16 shrink-0 justify-center px-0">完了</StatusBadge>;
  if (status === "overdue") return <StatusBadge tone="danger" className="w-16 shrink-0 justify-center px-0">期限切れ</StatusBadge>;
  return <StatusBadge tone="primary" className="w-16 shrink-0 justify-center px-0">未完</StatusBadge>;
}

function Section({ title, items }: { title: string; items: Task[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold leading-5 text-ink">{title}</div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <li key={t.taskId} className="grid min-h-[116px] grid-rows-[1fr_auto] rounded-xl border border-line bg-panel px-4 py-3 shadow-softSm">
            <div className="grid grid-cols-[minmax(0,1fr)_4rem] items-start gap-3">
              <div className="min-w-0">
                <div className="line-clamp-2 text-sm font-semibold leading-6 text-ink sm:leading-5">{t.title}</div>
              </div>
              <Badge status={t.status} />
            </div>
            <div className="mt-3 border-t border-line/70 pt-2 text-xs leading-4 text-inkMuted">期限: {t.dueDate}</div>
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
