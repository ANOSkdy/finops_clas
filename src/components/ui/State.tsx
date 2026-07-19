import Link from "next/link";
import type { ReactNode } from "react";

export function LoadingState({ label = "読み込んでいます" }: { label?: string }) {
  return <div className="route-loading-overlay" role="status" aria-live="polite">
    <div className="route-loading-indicator">
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  </div>;
}
export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) { return <div className="state"><div><h2>{title}</h2><p>{message}</p>{action}</div></div>; }
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) { return <div className="state" role="alert"><div><h2>読み込めませんでした</h2><p>{message}</p>{onRetry ? <button className="button button-secondary" onClick={onRetry}>再試行</button> : null}</div></div>; }
export function NeedsCompanyState() { return <EmptyState title="会社を選択してください" message="この画面を利用するには、操作する会社を選択します。" action={<Link className="button-link" href="/selectcompany">会社を選択</Link>} />; }
