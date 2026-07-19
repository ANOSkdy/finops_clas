export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: string }> = {
    pending: { label: "未完了", tone: "neutral" }, overdue: { label: "期限切れ", tone: "danger" }, done: { label: "完了", tone: "success" },
    queued: { label: "送信待ち", tone: "neutral" }, sent: { label: "送信済み", tone: "success" }, failed: { label: "失敗", tone: "danger" }
  };
  const item = map[status] ?? { label: status, tone: "neutral" };
  return <span className="status-badge" data-tone={item.tone}>{item.label}</span>;
}
