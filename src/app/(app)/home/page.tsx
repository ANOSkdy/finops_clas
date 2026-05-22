"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast";

type ReminderTask = {
  taskId: string;
  title: string;
  dueDate: string;
  status: "pending" | "done" | "overdue";
};

type Summary = {
  alerts: Array<{ type: "warning"; message: string }>;
  upcomingTasks: ReminderTask[];
  reminderGroups?: {
    overdue: ReminderTask[];
    today: ReminderTask[];
    within3Days: ReminderTask[];
    within7Days: ReminderTask[];
    within14Days: ReminderTask[];
    within30Days: ReminderTask[];
  };
};

function AlertItem({ message }: { message: string }) {
  return <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] shadow-sm px-4 py-3 text-sm text-[var(--color-text-primary)]">{message}</div>;
}

function TaskItem({ title, dueDate }: { title: string; dueDate: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] shadow-sm px-4 py-3">
      <div className="text-sm font-medium text-[var(--color-text-primary)]">{title}</div>
      <div className="mt-1 text-xs text-[var(--color-text-secondary)]">期限: {dueDate}</div>
    </div>
  );
}

export default function HomePage() {
  const { toast } = useToast();

  const [data, setData] = useState<Summary | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "needsCompany" | "needsLogin" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/home/summary", { credentials: "include" });

      if (res.status === 401) {
        setState("needsLogin");
        return;
      }
      if (res.status === 404) {
        setState("needsCompany");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }

      const json = (await res.json()) as Summary;
      setData(json);
      setState("ok");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const skeleton = (
    <div aria-busy="true" className="space-y-3">
      <Skeleton className="h-20" />
      <Skeleton className="h-40" />
      <Skeleton className="h-32" />
    </div>
  );

  const groups = [
    { key: "overdue", label: "期限切れ" },
    { key: "today", label: "本日期限" },
    { key: "within3Days", label: "3日以内" },
    { key: "within7Days", label: "7日以内" },
    { key: "within14Days", label: "14日以内" },
    { key: "within30Days", label: "30日以内" },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">ホーム</div>
        <div className="mt-1 text-sm text-[var(--color-text-secondary)]">アラートと期限の近いタスクを確認します。</div>
      </div>
      {state === "loading" && skeleton}
      {state === "ok" && data && (
        <>
          <Card><CardHeader><div className="text-base font-semibold">リマインダー</div></CardHeader><CardContent className="py-1"><div className="grid gap-3 md:grid-cols-2">{data.alerts.map((a, i) => <AlertItem key={i} message={a.message} />)}</div></CardContent></Card>
          <Card>
            <CardHeader><div className="text-base font-semibold">期限タスク一覧</div></CardHeader>
            <CardContent className="space-y-4 py-1">
              {data.reminderGroups
                ? groups.map((group) => {
                    const items = data.reminderGroups?.[group.key] ?? [];
                    if (items.length === 0) return null;
                    return (
                      <section key={group.key} className="space-y-2">
                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">{group.label}</div>
                        <div className="grid gap-3 md:grid-cols-2">{items.map((t) => <TaskItem key={t.taskId} title={t.title} dueDate={t.dueDate} />)}</div>
                      </section>
                    );
                  })
                : data.upcomingTasks.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2">{data.upcomingTasks.map((t) => <TaskItem key={t.taskId} title={t.title} dueDate={t.dueDate} />)}</div>
                  )}
            </CardContent>
          </Card>
        </>
      )}
      {state === "needsLogin" && <Card><CardHeader><div className="text-base font-semibold">ログインが必要です</div></CardHeader><CardContent className="flex items-center gap-3"><a href="/login"><Button>ログインへ</Button></a><Button variant="secondary" onClick={() => { toast({ variant: "default", description: "再試行します" }); load(); }}>再試行</Button></CardContent></Card>}
      {state === "needsCompany" && <Card><CardHeader><div className="text-base font-semibold">会社が選択されていません</div></CardHeader><CardContent className="flex items-center gap-3"><a href="/selectcompany"><Button>会社を選択</Button></a><Button variant="secondary" onClick={load}>再試行</Button></CardContent></Card>}
      {state === "error" && <Card><CardHeader><div className="text-base font-semibold">読み込みに失敗しました</div></CardHeader><CardContent className="flex items-center gap-3"><Button onClick={load}>再試行</Button></CardContent></Card>}
    </div>
  );
}
