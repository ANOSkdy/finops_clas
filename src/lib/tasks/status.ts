import { fromDateUtc, todayInTokyo } from "@/lib/date/business-date";

export function visibleTaskStatus(status: string, dueDate: Date, today = todayInTokyo()) {
  if (status === "done") return "done" as const;
  return fromDateUtc(dueDate) < today ? ("overdue" as const) : ("pending" as const);
}
