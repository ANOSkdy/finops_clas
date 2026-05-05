"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Summary = {
  alerts: Array<{ type: "warning"; message: string }>;
  upcomingTasks: Array<{ taskId: string; title: string; dueDate: string; status: "pending" | "done" | "overdue" }>;
};

function TaskCard({ title, dueDate, status }: Summary["upcomingTasks"][number]) {
  const tone = status === "overdue" ? "danger" : status === "done" ? "success" : "primary";
  const label = status === "overdue" ? "期限切れ" : status === "done" ? "完了" : "未完";
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3 shadow-softSm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-5 text-ink">{title}</div>
          <div className="mt-1 text-xs text-inkMuted">期限: {dueDate}</div>
        </div>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
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
      if (res.status === 401) { setState("needsLogin"); return; }
      if (res.status === 404) { setState("needsCompany"); return; }
      if (!res.ok) { setState("error"); return; }
      setData((await res.json()) as Summary);
      setState("ok");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="ホーム"
        description="アラートと期限の近いタスクを確認します。"
        action={<a href="/upload"><Button>アップロードへ</Button></a>}
      />

      {state === "loading" && (
        <div aria-busy="true" className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-40 md:col-span-2" />
        </div>
      )}

      {state === "needsLogin" && (
        <Card className="glass">
          <CardHeader><div className="text-base font-semibold">ログインが必要です</div></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href="/login"><Button>ログインへ</Button></a>
            <Button variant="secondary" onClick={() => { toast({ description: "再試行します" }); load(); }}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "needsCompany" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">会社が選択されていません</div>
            <div className="mt-1 text-sm text-inkMuted">会社を選択すると利用できます。</div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href="/selectcompany"><Button>会社を選択</Button></a>
            <Button variant="secondary" onClick={load}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "error" && (
        <Card className="glass">
          <CardHeader><div className="text-base font-semibold">読み込みに失敗しました</div></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={load}>再試行</Button>
            <a href="/manual"><Button variant="secondary">マニュアル</Button></a>
          </CardContent>
        </Card>
      )}

      {state === "ok" && data && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
          <Card className="glass">
            <CardHeader>
              <div className="text-base font-semibold">リマインダー</div>
              <div className="mt-1 text-sm text-inkMuted">期限前/期限切れの通知</div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-3">
              {data.alerts.length === 0 ? (
                <div className="rounded-xl border border-line bg-panel px-4 py-5 text-sm text-inkMuted">通知はありません。</div>
              ) : data.alerts.map((a, i) => (
                <div key={i} className="rounded-xl border border-accent1/45 bg-accent1/15 px-4 py-3 text-sm leading-6 text-ink">
                  <div className="mb-2"><StatusBadge tone="warning">確認</StatusBadge></div>
                  {a.message}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <div className="text-base font-semibold">期限が近いタスク</div>
              <div className="mt-1 text-sm text-inkMuted">直近14日</div>
            </CardHeader>
            <CardContent className="pt-3">
              {data.upcomingTasks.length === 0 ? (
                <div className="rounded-xl border border-line bg-panel px-4 py-5 text-sm text-inkMuted">該当タスクはありません。</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.upcomingTasks.map((t) => <TaskCard key={t.taskId} {...t} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
