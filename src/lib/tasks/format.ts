export type TaskStatus = "pending" | "done" | "overdue";
export type TaskCategory = "tax" | "social" | "other";

export function startOfTodayUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeTaskStatus(dbStatus: string, dueDate: Date, now = new Date()): TaskStatus {
  if (dbStatus === "done") return "done";
  const today = startOfTodayUtc(now);
  return dueDate < today ? "overdue" : "pending";
}