"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskList } from "@/components/features/tasks/TaskList";
import { useToast } from "@/components/ui/toast";

type Task = {
  taskId: string;
  category: "tax" | "social" | "other";
  title: string;
  dueDate: string;
  status: "pending" | "done" | "overdue";
};

export default function SchedulePage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [state, setState] = useState<"loading"|"ok"|"needsCompany"|"needsLogin"|"error">("loading");
  const [updating, setUpdating] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    setTasks(null);
    try {
      const res = await fetch("/api/schedule/list?includeDone=true", { credentials: "include" });

      if (res.status === 401) { setState("needsLogin"); setTasks([]); return; }
      if (res.status === 404) { setState("needsCompany"); setTasks([]); return; }
      if (!res.ok) { setState("error"); setTasks([]); return; }

      const data = (await res.json()) as Task[];
      setTasks(data);
      setState("ok");
    } catch {
      setState("error");
      setTasks([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshTasks = useCallback(async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/schedule/refresh", { method: "POST", credentials: "include" });

      if (res.status === 401) { setState("needsLogin"); setTasks([]); toast({ variant: "error", description: "ログインしてください" }); return; }
      if (res.status === 404) { setState("needsCompany"); setTasks([]); toast({ variant: "error", description: "会社を選択してください" }); return; }
      if (!res.ok) { setState("error"); toast({ variant: "error", description: "タスク更新に失敗しました" }); return; }

      toast({ variant: "success", description: "タスクを更新しました" });
      await load();
    } catch {
      setState("error");
      toast({ variant: "error", description: "タスク更新中にエラーが発生しました" });
    } finally {
      setUpdating(false);
    }
  }, [load, toast]);

  const skeleton = (
    <div aria-busy="true" className="space-y-3">
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  );

  const threeMonthsLater = (() => {
    const now = new Date();
    const limit = new Date(now);
    limit.setMonth(now.getMonth() + 3);
    return limit;
  })();
  const filteredByCompletion = tasks
    ? showCompleted
      ? tasks
      : tasks.filter((t) => t.status !== "done")
    : null;
  const filteredByOverdue = filteredByCompletion
    ? onlyOverdue
      ? filteredByCompletion.filter((t) => t.status === "overdue")
      : filteredByCompletion
    : null;
  const visibleTasks = filteredByOverdue
    ? showAll
      ? filteredByOverdue
      : filteredByOverdue.filter((t) => {
          const due = new Date(t.dueDate);
          return due <= threeMonthsLater;
        })
    : null;
  const hasTasksBeyondThreeMonths =
    filteredByOverdue?.some((t) => {
      const due = new Date(t.dueDate);
      return due > threeMonthsLater;
    }) ?? false;
  const hasCompletedTasks = tasks?.some((t) => t.status === "done") ?? false;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">スケジュール</div>
        <div className="mt-1 text-sm text-inkMuted">カテゴリ別にタスクを一覧表示します。</div>
        <div className="mt-3 w-full max-w-[360px]">
          <Button className="w-full" onClick={refreshTasks} disabled={updating}>
            タスクの更新
          </Button>
        </div>
      </div>

      {state === "loading" && skeleton}

      {state === "needsLogin" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">ログインが必要です</div>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <a href="/login"><Button>ログインへ</Button></a>
            <Button variant="secondary" onClick={() => { toast({variant:"default", description:"再試行します"}); load(); }}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "needsCompany" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">会社が選択されていません</div>
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
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Button onClick={load}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "ok" && tasks && (
        <div className="space-y-3">
          <TaskList tasks={visibleTasks ?? []} />
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
            {hasCompletedTasks && (
              <Button variant="secondary" onClick={() => setShowCompleted((v) => !v)}>
                {showCompleted ? "完了を非表示" : "完了を表示"}
              </Button>
            )}
            <Button
              variant={onlyOverdue ? "primary" : "secondary"}
              onClick={() => {
                setOnlyOverdue((v) => !v);
                if (!onlyOverdue) setShowCompleted(false);
              }}
            >
              {onlyOverdue ? "すべて表示" : "期限切れのみ表示"}
            </Button>
            {filteredByOverdue && filteredByOverdue.length > 0 && (showAll || hasTasksBeyondThreeMonths) && (
              <Button variant="secondary" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "3ヶ月以内のみ表示" : "表示を増やす"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
