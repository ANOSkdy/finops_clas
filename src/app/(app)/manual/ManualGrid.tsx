"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextareaField, TextField } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { ManualCategory, ManualProcedureRow, ManualStatus } from "@/lib/manual/procedures";

const categoryLabel: Record<ManualCategory, string> = {
  tax: "税務関係届出",
  social_insurance: "社会保険・労働保険",
  registration: "登記事項変更"
};
const statusLabel: Record<ManualStatus, string> = {
  not_started: "未着手",
  in_progress: "対応中",
  completed: "完了"
};
const categoryOrder: ManualCategory[] = ["tax", "social_insurance", "registration"];
const emptyForm = {
  category: "tax" as ManualCategory,
  title: "",
  trigger: "",
  deadline: "",
  submissionDestination: "",
  cost: "",
  notes: ""
};

function sortProcedures(procedures: ManualProcedureRow[]) {
  return [...procedures].sort((a, b) => {
    const categoryDifference = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    if (categoryDifference !== 0) return categoryDifference;
    if (a.custom !== b.custom) return a.custom ? 1 : -1;
    return a.title.localeCompare(b.title, "ja");
  });
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a, button, input, select, textarea"));
}

export function ManualGrid({ initialProcedures }: { initialProcedures: ManualProcedureRow[] }) {
  const [procedures, setProcedures] = useState(initialProcedures);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ManualCategory | "">("");
  const [status, setStatus] = useState<ManualStatus | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<ManualProcedureRow | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");
    return procedures.filter((procedure) => {
      if (category && procedure.category !== category) return false;
      if (status && procedure.status !== status) return false;
      if (!normalizedQuery) return true;
      return [procedure.title, procedure.trigger, procedure.deadline, procedure.submissionDestination, procedure.cost, procedure.notes]
        .some((value) => value?.toLocaleLowerCase("ja").includes(normalizedQuery));
    });
  }, [category, procedures, query, status]);

  async function updateStatus(procedureId: string, nextStatus: ManualStatus) {
    const previous = procedures.find((procedure) => procedure.id === procedureId)?.status;
    if (!previous || previous === nextStatus || savingStatus === procedureId) return;
    setError("");
    setSavingStatus(procedureId);
    setProcedures((current) => current.map((procedure) => procedure.id === procedureId ? { ...procedure, status: nextStatus } : procedure));
    try {
      await apiFetch(`/api/manual/procedures/${procedureId}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
    } catch (caught) {
      setProcedures((current) => current.map((procedure) => procedure.id === procedureId ? { ...procedure, status: previous } : procedure));
      setError(caught instanceof ApiError ? caught.message : "ステータスを保存できませんでした");
    } finally {
      setSavingStatus(null);
    }
  }

  async function createProcedure(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await apiFetch<{ procedure: ManualProcedureRow }>("/api/manual/procedures", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          submissionDestination: form.submissionDestination || null,
          cost: form.cost || null
        })
      });
      setProcedures((current) => sortProcedures([...current, result.procedure]));
      setForm(emptyForm);
      setDialogOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "レコードを登録できませんでした");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="page manual-grid-page">
    <PageHeader
      title="各種届出・手続き"
      actions={<Button onClick={() => setDialogOpen(true)}>レコードを追加</Button>}
    />

    {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
    <div className="toolbar manual-grid-toolbar">
      <TextField label="検索" className="search-field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="手続き名・期限・提出先・注意点" />
      <SelectField label="区分" value={category} onChange={(event) => setCategory(event.target.value as ManualCategory | "")}>
        <option value="">すべて</option>
        {categoryOrder.map((value) => <option value={value} key={value}>{categoryLabel[value]}</option>)}
      </SelectField>
      <SelectField label="ステータス" value={status} onChange={(event) => setStatus(event.target.value as ManualStatus | "")}>
        <option value="">すべて</option>
        {(Object.keys(statusLabel) as ManualStatus[]).map((value) => <option value={value} key={value}>{statusLabel[value]}</option>)}
      </SelectField>
      <span className="manual-result-count">{filtered.length}件</span>
    </div>

    <div className="manual-grid-wrap" role="region" aria-label="各種届出・手続き一覧" tabIndex={0}>
      <table className="manual-grid">
        <caption>各種届出・手続き一覧</caption>
        <thead><tr><th>No.</th><th>区分</th><th>手続き・届出名</th><th>発生事由</th><th>提出・申請期限</th><th>提出先</th><th>登録免許税・費用</th><th>ステータス</th><th>備考・実務上の注意点</th></tr></thead>
        <tbody>{filtered.map((procedure, index) => <tr
          key={procedure.id}
          data-clickable="true"
          tabIndex={0}
          aria-label={`${procedure.title}の詳細を開く`}
          aria-haspopup="dialog"
          onClick={(event) => { if (!isInteractiveTarget(event.target)) setSelectedProcedure(procedure); }}
          onKeyDown={(event) => {
            if (!isInteractiveTarget(event.target) && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              setSelectedProcedure(procedure);
            }
          }}
        >
          <td className="manual-grid-number">{index + 1}</td>
          <td title={categoryLabel[procedure.category]}><span className="manual-category" data-category={procedure.category}>{categoryLabel[procedure.category]}</span></td>
          <th scope="row" title={procedure.title}><span>{procedure.title}</span>{procedure.custom ? <small>会社追加</small> : null}</th>
          <td title={procedure.trigger}>{procedure.trigger}</td>
          <td title={procedure.deadline}>{procedure.deadline}</td>
          <td title={procedure.submissionDestination || undefined}>{procedure.submissionDestination || "—"}</td>
          <td className="manual-grid-cost" title={procedure.cost || undefined}>{procedure.cost || "—"}</td>
          <td>
            <select
              className="manual-status-select"
              data-status={procedure.status}
              value={procedure.status}
              disabled={savingStatus === procedure.id}
              aria-label={`${procedure.title}のステータス`}
              onChange={(event) => void updateStatus(procedure.id, event.target.value as ManualStatus)}
            >
              {(Object.keys(statusLabel) as ManualStatus[]).map((value) => <option value={value} key={value}>{statusLabel[value]}</option>)}
            </select>
          </td>
          <td title={procedure.notes || undefined}>{procedure.notes || "—"}</td>
        </tr>)}</tbody>
      </table>
      {filtered.length === 0 ? <p className="manual-grid-empty">条件に一致するレコードはありません。</p> : null}
    </div>

    <Dialog.Root open={selectedProcedure !== null} onOpenChange={(open) => { if (!open) setSelectedProcedure(null); }}><Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content manual-detail-dialog">
        {selectedProcedure ? <>
          <header className="manual-detail-dialog-header">
            <div className="manual-detail-dialog-meta">
              <span className="manual-category" data-category={selectedProcedure.category}>{categoryLabel[selectedProcedure.category]}</span>
              <span className="manual-detail-status" data-status={selectedProcedure.status}>{statusLabel[selectedProcedure.status]}</span>
              {selectedProcedure.custom ? <span className="manual-detail-custom">会社追加</span> : null}
            </div>
            <Dialog.Title asChild><h2>{selectedProcedure.title}</h2></Dialog.Title>
            <Dialog.Description className="dialog-description">登録内容を読み取り専用で表示しています。</Dialog.Description>
          </header>
          <dl className="manual-detail-record">
            <div className="manual-detail-field span-2"><dt>発生事由</dt><dd>{selectedProcedure.trigger}</dd></div>
            <div className="manual-detail-field"><dt>提出・申請期限</dt><dd>{selectedProcedure.deadline}</dd></div>
            <div className="manual-detail-field"><dt>提出先</dt><dd>{selectedProcedure.submissionDestination || "—"}</dd></div>
            <div className="manual-detail-field"><dt>登録免許税・費用</dt><dd>{selectedProcedure.cost || "—"}</dd></div>
            <div className="manual-detail-field"><dt>ステータス</dt><dd>{statusLabel[selectedProcedure.status]}</dd></div>
            <div className="manual-detail-field span-2"><dt>備考・実務上の注意点</dt><dd>{selectedProcedure.notes || "—"}</dd></div>
          </dl>
          <div className="dialog-actions manual-detail-dialog-actions"><Dialog.Close asChild><Button type="button" variant="secondary">閉じる</Button></Dialog.Close></div>
        </> : null}
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>

    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}><Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content manual-record-dialog">
        <Dialog.Title asChild><h2>手続きレコードを追加</h2></Dialog.Title>
        <Dialog.Description className="dialog-description">この会社で管理する独自の届出・手続きを登録します。</Dialog.Description>
        <form onSubmit={createProcedure}>
          <div className="form-grid">
            <SelectField label="区分" requiredLabel value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ManualCategory })}>
              {categoryOrder.map((value) => <option value={value} key={value}>{categoryLabel[value]}</option>)}
            </SelectField>
            <TextField label="手続き・届出名" requiredLabel maxLength={300} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <TextareaField label="発生事由" requiredLabel className="span-2" maxLength={5_000} value={form.trigger} onChange={(event) => setForm({ ...form, trigger: event.target.value })} />
            <TextareaField label="提出・申請期限" requiredLabel maxLength={2_000} value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
            <TextareaField label="提出先" maxLength={2_000} value={form.submissionDestination} onChange={(event) => setForm({ ...form, submissionDestination: event.target.value })} />
            <TextareaField label="登録免許税・費用" maxLength={2_000} value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} />
            <TextareaField label="備考・実務上の注意点" maxLength={10_000} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>
          <div className="dialog-actions"><Dialog.Close asChild><Button type="button" variant="secondary">キャンセル</Button></Dialog.Close><Button type="submit" busy={submitting} disabled={!form.title.trim() || !form.trigger.trim() || !form.deadline.trim()}>登録する</Button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>
  </div>;
}
