export type ReminderGroupKey =
  | "overdue"
  | "today"
  | "within3Days"
  | "within7Days"
  | "within14Days"
  | "within30Days";

export type ReminderPolicyKind = "major" | "monthly" | "municipal" | "default";

const MAJOR_PREFIXES = ["tax:corp", "tax:corporate", "tax:consumption", "tax:sole-income", "tax:sole-consumption"];
const MONTHLY_PREFIXES = ["tax:withholding", "tax:resident-special-collection"];
const MUNICIPAL_PREFIXES = ["tax:recurring"];

export function classifyReminderPolicy(taskKey?: string | null): ReminderPolicyKind {
  if (!taskKey) return "default";
  if (MAJOR_PREFIXES.some((prefix) => taskKey.startsWith(prefix))) return "major";
  if (MONTHLY_PREFIXES.some((prefix) => taskKey.startsWith(prefix))) return "monthly";
  if (MUNICIPAL_PREFIXES.some((prefix) => taskKey.startsWith(prefix))) return "municipal";
  return "default";
}

export function getReminderGroupKey(dueDate: Date, today: Date): ReminderGroupKey | null {
  const due = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysDiff = Math.floor((due - base) / (24 * 60 * 60 * 1000));

  if (daysDiff < 0) return "overdue";
  if (daysDiff === 0) return "today";
  if (daysDiff <= 3) return "within3Days";
  if (daysDiff <= 7) return "within7Days";
  if (daysDiff <= 14) return "within14Days";
  if (daysDiff <= 30) return "within30Days";
  return null;
}

export function createEmptyReminderGroups<T>() {
  return {
    overdue: [] as T[],
    today: [] as T[],
    within3Days: [] as T[],
    within7Days: [] as T[],
    within14Days: [] as T[],
    within30Days: [] as T[],
  };
}
