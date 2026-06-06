"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/toast";

const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3] as const;

type ChecklistItem = {
  id: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
};

type ChecklistCheck = {
  itemId: string;
  month: number;
  checked: boolean;
};

type ChecklistResponse = {
  fiscalYear: number;
  items: ChecklistItem[];
  checks: ChecklistCheck[];
};

type PageState = "loading" | "ok" | "needsLogin" | "needsCompany" | "forbidden" | "error";

function getCurrentFiscalYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}

function checkKey(itemId: string, month: number) {
  return `${itemId}:${month}`;
}

export default function AccountingChecklistPage() {
  const { toast } = useToast();
  const [state, setState] = useState<PageState>("loading");
  const [fiscalYear, setFiscalYear] = useState(getCurrentFiscalYear());
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const checkedSet = useMemo(() => {
    return new Set((data?.checks ?? []).filter((check) => check.checked).map((check) => checkKey(check.itemId, check.month)));
  }, [data]);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/accounting-checklist?fiscalYear=${fiscalYear}`, { credentials: "include" });
      if (res.status === 401) { setState("needsLogin"); setData(null); return; }
      if (res.status === 403) { setState("forbidden"); setData(null); return; }
      if (res.status === 404) { setState("needsCompany"); setData(null); return; }
      if (!res.ok) { setState("error"); setData(null); return; }

      const nextData = (await res.json()) as ChecklistResponse;
      setData(nextData);
      setFiscalYear(nextData.fiscalYear);
      setState("ok");
    } catch {
      setState("error");
      setData(null);
    }
  }, [fiscalYear]);

  useEffect(() => { load(); }, [load]);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newItemName.trim();
    if (!name) {
      toast({ variant: "error", description: "項目名を入力してください" });
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/accounting-checklist/items", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 403) {
        toast({ variant: "error", description: "編集権限がありません" });
        return;
      }
      if (res.status === 409) {
        toast({ variant: "error", description: "同じ名前の項目が既にあります" });
        return;
      }
      if (!res.ok) {
        toast({ variant: "error", description: "項目の追加に失敗しました" });
        return;
      }
      setNewItemName("");
      toast({ variant: "success", description: "項目を追加しました" });
      await load();
    } catch {
      toast({ variant: "error", description: "項目追加中にエラーが発生しました" });
    } finally {
      setAdding(false);
    }
  }

  async function toggleCheck(itemId: string, month: number, checked: boolean) {
    const key = checkKey(itemId, month);
    setUpdatingKey(key);
    setData((prev) => {
      if (!prev) return prev;
      const withoutCurrent = prev.checks.filter((check) => checkKey(check.itemId, check.month) !== key);
      return { ...prev, checks: checked ? [...withoutCurrent, { itemId, month, checked }] : withoutCurrent };
    });

    try {
      const res = await fetch("/api/accounting-checklist/checks", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId, fiscalYear, month, checked }),
      });
      if (!res.ok) {
        toast({ variant: "error", description: "チェック状態の保存に失敗しました" });
        await load();
        return;
      }
    } catch {
      toast({ variant: "error", description: "チェック状態の保存中にエラーが発生しました" });
      await load();
    } finally {
      setUpdatingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">会計資料チェック表</div>
        <div className="mt-1 text-sm text-[var(--color-text-secondary)]">年度ごとに月別の会計資料の受領状況を管理します。</div>
      </div>

      {state === "loading" && (
        <Card>
          <CardHeader><div className="text-base font-semibold">読み込み中…</div></CardHeader>
          <CardContent><div className="h-24 animate-pulse rounded-lg bg-[var(--color-bg-secondary)]" /></CardContent>
        </Card>
      )}

      {state === "needsLogin" && (
        <Card>
          <CardHeader><div className="text-base font-semibold">ログインが必要です</div></CardHeader>
          <CardContent className="flex items-center gap-3">
            <a href="/login"><Button>ログインへ</Button></a>
            <Button variant="secondary" onClick={load}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "needsCompany" && (
        <Card>
          <CardHeader><div className="text-base font-semibold">会社が選択されていません</div></CardHeader>
          <CardContent className="flex items-center gap-3">
            <a href="/selectcompany"><Button>会社を選択</Button></a>
            <Button variant="secondary" onClick={load}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "forbidden" && (
        <Card>
          <CardHeader><div className="text-base font-semibold">アクセス権限がありません</div></CardHeader>
          <CardContent><Button variant="secondary" onClick={load}>再試行</Button></CardContent>
        </Card>
      )}

      {state === "error" && (
        <Card>
          <CardHeader><div className="text-base font-semibold">読み込みに失敗しました</div></CardHeader>
          <CardContent><Button onClick={load}>再試行</Button></CardContent>
        </Card>
      )}

      {state === "ok" && data && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-base font-semibold">{data.fiscalYear}年度</div>
                <div className="mt-1 text-sm text-[var(--color-text-secondary)]">4月から翌年3月までの会計資料チェックです。</div>
              </div>
              <Field
                label="年度"
                type="number"
                min={2000}
                max={2100}
                value={fiscalYear}
                onChange={(event) => setFiscalYear(Number(event.target.value))}
                onBlur={load}
                className="w-full sm:w-36"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addItem} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field
                label="自由項目を追加"
                value={newItemName}
                onChange={(event) => setNewItemName(event.target.value)}
                maxLength={100}
                className="min-w-0 flex-1"
              />
              <Button type="submit" disabled={adding}>{adding ? "追加中…" : "項目追加"}</Button>
            </form>

            <div className="max-w-full overflow-x-auto rounded-lg border border-[var(--color-border-default)]">
              <table className="min-w-[920px] w-full border-collapse text-sm">
                <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 w-56 border-r border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-3 text-left font-semibold">
                      資料
                    </th>
                    {FISCAL_MONTHS.map((month) => (
                      <th key={month} scope="col" className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                        {month}月
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--color-border-default)]">
                      <th scope="row" className="sticky left-0 z-10 border-r border-[var(--color-border-default)] bg-[var(--color-surface-normal)] px-3 py-3 text-left font-medium">
                        {item.name}
                      </th>
                      {FISCAL_MONTHS.map((month) => {
                        const key = checkKey(item.id, month);
                        const checked = checkedSet.has(key);
                        return (
                          <td key={month} className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              aria-label={`${item.name} ${month}月`}
                              checked={checked}
                              disabled={updatingKey === key}
                              onChange={(event) => toggleCheck(item.id, month, event.target.checked)}
                              className="focus-ring h-5 w-5 rounded border-[var(--color-border-default)] accent-[var(--color-surface-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
