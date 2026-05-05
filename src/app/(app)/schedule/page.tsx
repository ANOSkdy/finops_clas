"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TaskList } from "@/components/features/tasks/TaskList";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/PageHeader";

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

  const load = useCallback(async () => {
    setState("loading");
    setTasks(null);
    try {
      const res = await fetch("/api/schedule/list", { credentials: "include" });
      if (res.status === 401) { setState("needsLogin"); setTasks([]); return; }
      if (res.status === 404) { setState("needsCompany"); setTasks([]); return; }
      if (!res.ok) { setState("error"); setTasks([]); return; }
      setTasks((await res.json()) as Task[]);
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

  const threeMonthsLater = (() => {
    const now = new Date();
    const limit = new Date(now);
    limit.setMonth(now.getMonth() + 3);
    return limit;
  })();

  const visibleTasks = tasks ? showAll ? tasks : tasks.filter((t) => new Date(t.dueDate) <= threeMonthsLater) : null;
  const hasTasksBeyondThreeMonths = tasks?.some((t) => new Date(t.dueDate) > threeMonthsLater) ?? false;

  return (
    <div className="space-y-5">
      <PageHeader
        title="スケジュール"
        description="カテゴリ別に期限タスクを確認します。"
        action={<Button onClick={refreshTasks} disabled={updating}>{updating ? "更新中…" : "タスクの更新"}</Button>}
      />

      {state === "loading" && (
        <div aria-busy="true" className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {state === "needsLogin" && (
        <Card className="glass">
          <CardHeader><div className="text-base font-semibold">ログインが必要です</div></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href="/login"><Button>ログインへ</Button></a>
            <Button variant="secondary" onClick={() => { toast({variant:"default", description:"再試行します"}); load(); }}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "needsCompany" && (
        <Card className="glass">
          <CardHeader><div className="text-base font-semibold">会社が選択されていません</div></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href="/selectcompany"><Button>会社を選択</Button></a>
            <Button variant="secondary" onClick={load}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "error" && (
        <Card className="glass">
          <CardHeader><div className="text-base font-semibold">読み込みに失敗しました</div></CardHeader>
          <CardContent><Button onClick={load}>再試行</Button></CardContent>
        </Card>
      )}

      {state === "ok" && tasks && (
        <div className="space-y-4">
          <TaskList tasks={visibleTasks ?? []} />
          {tasks.length > 0 && (showAll || hasTasksBeyondThreeMonths) && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "3ヶ月以内のみ表示" : "表示を増やす"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
