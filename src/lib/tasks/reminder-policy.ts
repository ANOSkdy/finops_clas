import type { DateOnly } from "@/lib/date/business-date";

export function daysBetween(from: DateOnly, to: DateOnly) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function reminderOffsets(taskKey: string | null) {
  if (taskKey?.startsWith("corporate-") || taskKey?.startsWith("consumption-") || taskKey?.startsWith("income-")) return [30, 14, 7, 3, 0];
  if (taskKey?.startsWith("withholding-") || taskKey?.startsWith("resident-")) return [7, 3, 1, 0];
  if (taskKey?.startsWith("recurring-")) return [14, 7, 1, 0];
  return [7, 1, 0];
}

export function reminderKey(taskKey: string | null, dueDate: DateOnly, today: DateOnly) {
  const days = daysBetween(today, dueDate);
  if (days < 0) return "overdue";
  return reminderOffsets(taskKey).includes(days) ? `d-${days}` : null;
}
