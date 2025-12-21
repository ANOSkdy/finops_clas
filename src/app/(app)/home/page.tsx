"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast";

type Summary = {
  alerts: Array<{ type: "warning"; message: string }>;
  upcomingTasks: Array<{ taskId: string; title: string; dueDate: string; status: "pending" | "done" | "overdue" }>;
};

export default function HomePage() {
  const { toast } = useToast();

  const [data, setData] = useState<Summary | null>(null);
  const [state, setState] = useState<"loading"|"ok"|"needsCompany"|"needsLogin"|"error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/home/summary", { credentials: "include" });

      if (res.status === 401) { setState("needsLogin"); return; }
      if (res.status === 404) { setState("needsCompany"); return; }
      if (!res.ok) { setState("error"); return; }

      const json = (await res.json()) as Summary;
      setData(json);
      setState("ok");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const skeleton = (
    <div aria-busy="true" className="space-y-3">
      <Skeleton className="h-20" />
      <Skeleton className="h-40" />
      <Skeleton className="h-32" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">Home</div>
        <div className="mt-1 text-sm text-inkMuted">アラートと期限の近いタスクを確認します。</div>
      </div>

      {state === "loading" && skeleton}

      {state === "needsLogin" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">ログインが必要です</div>
            <div className="mt-1 text-sm text-inkMuted">セッションが無効です。</div>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <a href="/login"><Button>ログインへ</Button></a>
            <Button variant="secondary" onClick={() => { toast({variant:"default", description:"再試行します"}); load(); }}>
              再試行
            </Button>
          </CardContent>
        </Card>
      )}

      {state === "needsCompany" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">会社が選択されていません</div>
            <div className="mt-1 text-sm text-inkMuted">会社を選択するとHome/Scheduleが利用できます。</div>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <a href="/selectcompany"><Button>会社を選択</Button></a>
            <Button variant="secondary" onClick={load}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "error" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">読み込みに失敗しました</div>
            <div className="mt-1 text-sm text-inkMuted">ネットワークやログイン状態を確認してください。</div>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Button onClick={load}>再試行</Button>
            <a href="/manual" className="ring-focus tap-44 inline-flex items-center justify-center rounded-xl px-3 text-sm text-primary underline">
              マニュアル
            </a>
          </CardContent>
        </Card>
      )}

      {state === "ok" && data && (
        <>
          <Card className="glass">
            <CardHeader>
              <div className="text-base font-semibold">Alerts</div>
              <div className="mt-1 text-sm text-inkMuted">期限前/期限切れの通知</div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.alerts.map((a, i) => (
                <div key={i} className="rounded-2xl border border-accent2/35 bg-accent2/10 px-4 py-3 text-sm text-ink">
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
            <CardContent>
              {data.upcomingTasks.length === 0 ? (
                <div className="text-sm text-inkMuted">該当タスクはありません。</div>
              ) : (
                <ul className="space-y-2">
                  {data.upcomingTasks.map((t) => (
                    <li key={t.taskId} className="rounded-2xl border border-line bg-white/85 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{t.title}</div>
                          <div className="mt-1 text-xs text-inkMuted">期限: {t.dueDate}</div>
                        </div>
                        <div className="text-xs text-inkMuted" aria-hidden="true">→</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <div className="text-base font-semibold">Quick Access</div>
              <div className="mt-1 text-sm text-inkMuted">よく使う機能へ</div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <a href="/schedule" className="ring-focus tap-44 rounded-2xl border border-primary/30 bg-base px-4 py-4 text-sm text-primary hover:bg-primary/10">Schedule</a>
              <a href="/upload" className="ring-focus tap-44 rounded-2xl border border-primary/30 bg-base px-4 py-4 text-sm text-primary hover:bg-primary/10">Upload</a>
              <a href="/manual" className="ring-focus tap-44 rounded-2xl border border-primary/30 bg-base px-4 py-4 text-sm text-primary hover:bg-primary/10">Manual</a>
              <a href="/settings" className="ring-focus tap-44 rounded-2xl border border-primary/30 bg-base px-4 py-4 text-sm text-primary hover:bg-primary/10">Settings</a>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
