"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { SelectField, TextField } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState, LoadingState, NeedsCompanyState } from "@/components/ui/State";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { ScheduleData } from "@/lib/tasks/list";

type Task = { id: string; title: string; category: string; dueDate: string; periodStart: string | null; periodEnd: string | null; status: "pending" | "overdue" | "done" };
type Data = ScheduleData;
const categoryLabel: Record<string, string> = { tax: "税務", labor: "労務", other: "その他" };

export function ScheduleView({ initialData, initialNeedsCompany = false }: { initialData: Data | null; initialNeedsCompany?: boolean }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Data | null>(initialData);
  const [error, setError] = useState("");
  const [needsCompany, setNeedsCompany] = useState(initialNeedsCompany);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState(["pending", "overdue", "done"].includes(searchParams.get("status") ?? "") ? searchParams.get("status") ?? "" : "");
  const requestedDays = searchParams.get("days");
  const [range, setRange] = useState(requestedDays === "7" || requestedDays === "30" ? `d${requestedDays}` : "3");
  const [todayOnly] = useState(searchParams.get("due") === "today");
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError(""); setNeedsCompany(false);
    try { setData(await apiFetch<Data>("/api/schedule/list")); }
    catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) setNeedsCompany(true);
      else setError(caught instanceof ApiError ? caught.message : "読み込めませんでした");
    }
  }, []);

  const filtered = useMemo(() => (data?.tasks ?? []).filter((task) => {
    if (query && !task.title.toLocaleLowerCase("ja").includes(query.toLocaleLowerCase("ja"))) return false;
    if (category && task.category !== category) return false;
    if (status && task.status !== status) return false;
    if (todayOnly && data && task.dueDate !== data.today) return false;
    if (!todayOnly && range !== "all" && data) {
      const end = new Date(`${data.today}T00:00:00Z`);
      if (range.startsWith("d")) end.setUTCDate(end.getUTCDate() + Number(range.slice(1)));
      else end.setUTCMonth(end.getUTCMonth() + Number(range));
      if (range.startsWith("d") && task.dueDate < data.today) return false;
      if (task.dueDate > end.toISOString().slice(0, 10)) return false;
    }
    return true;
  }), [data, query, category, status, range, todayOnly]);
  const grouped = useMemo(() => Map.groupBy(filtered, (task) => task.dueDate.slice(0, 7)), [filtered]);

  async function refresh() {
    setRefreshing(true); setNotice("");
    try {
      const result = await apiFetch<{ generated: number }>("/api/schedule/refresh", { method: "POST" });
      setNotice(`${result.generated}件を同期しました。完了済みタスクは保持されています。`);
      setRefreshOpen(false);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "再計算できませんでした");
      setRefreshOpen(false);
    } finally { setRefreshing(false); }
  }

  async function toggle(task: Task) {
    const next = task.status === "done" ? "pending" : "done";
    setUpdating(task.id);
    setData((current) => current ? { ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: next } : item) } : current);
    try {
      const response = await apiFetch<{ task: Task }>(`/api/tasks/${task.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setData((current) => current ? { ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: response.task.status } : item) } : current);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "状態を更新できませんでした");
      await load();
    } finally { setUpdating(null); }
  }

  if (needsCompany) return <div className="page"><PageHeader title="スケジュール" /><NeedsCompanyState /></div>;
  return <div className="page">
    <PageHeader title="スケジュール" description="税務・労務タスクを月ごとに確認します。" actions={<Button onClick={() => setRefreshOpen(true)} busy={refreshing}>スケジュールを再計算</Button>} />
    {notice ? <div className="alert alert-success" role="status">{notice}</div> : null}
    {error ? <ErrorState message={error} onRetry={load} /> : !data ? <LoadingState /> : <>
      {data.tasks.some((task) => task.dueDate > data.rule.holidayCoverageEnd) ? <div className="alert" role="status">祝日調整の公式掲載範囲は{data.rule.holidayCoverageEnd}までです。それ以降の期限は、公式日程の更新後に再計算してください。</div> : null}
      <div className="toolbar">
        <TextField label="検索" className="search-field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="タスク名" />
        <SelectField label="期間" value={todayOnly ? "today" : range} disabled={todayOnly} onChange={(event) => setRange(event.target.value)}>{todayOnly ? <option value="today">本日期限</option> : null}<option value="d7">今後7日</option><option value="d30">今後30日</option><option value="3">今後3か月</option><option value="6">今後6か月</option><option value="12">今後12か月</option><option value="all">すべて</option></SelectField>
        <SelectField label="状態" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">すべて</option><option value="pending">未完了</option><option value="overdue">期限切れ</option><option value="done">完了</option></SelectField>
        <SelectField label="分類" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">すべて</option><option value="tax">税務</option><option value="labor">労務</option><option value="other">その他</option></SelectField>
      </div>
      {filtered.length === 0 ? <EmptyState title="タスクはありません" message="現在の条件に一致するタスクはありません。再計算または条件変更をお試しください。" /> : [...grouped.entries()].map(([month, tasks]) => <section key={month}>
        <h2 className="month-heading">{Number(month.slice(0, 4))}年{Number(month.slice(5, 7))}月</h2>
        <div className="data-list">{tasks.map((task) => <div className="data-row" key={task.id}>
          <div className="row-title">{task.title}{task.periodStart ? <div className="row-meta">対象期間 {task.periodStart}〜{task.periodEnd}</div> : null}</div>
          <span>{categoryLabel[task.category]}</span>
          <time className="tabular" dateTime={task.dueDate}>{task.dueDate}</time>
          <StatusBadge status={task.status} />
          <Button variant="ghost" busy={updating === task.id} onClick={() => toggle(task)}>{task.status === "done" ? "未完了へ戻す" : "完了にする"}</Button>
        </div>)}</div>
      </section>)}
    </>}
    <ConfirmDialog open={refreshOpen} onOpenChange={setRefreshOpen} title="スケジュールを再計算" description="現在の会社設定を基に36か月分を同期します。不要な未完了の生成タスクだけを整理し、完了済みタスクは保持します。" actions={<><Button variant="secondary" onClick={() => setRefreshOpen(false)}>キャンセル</Button><Button busy={refreshing} onClick={refresh}>再計算する</Button></>} />
  </div>;
}
