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

  const load = useCallback(async () => {
    setState("loading");
    setTasks(null);
    try {
      const res = await fetch("/api/schedule/list", { credentials: "include" });

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

  const skeleton = (
    <div aria-busy="true" className="space-y-3">
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">Schedule</div>
        <div className="mt-1 text-sm text-inkMuted">カテゴリ別にタスクを一覧表示します。</div>
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

      {state === "ok" && tasks && <TaskList tasks={tasks} />}
    </div>
  );
}
