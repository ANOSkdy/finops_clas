export type ReminderEmailKey =
  | "30d_before"
  | "14d_before"
  | "7d_before"
  | "3d_before"
  | "1d_before"
  | "today"
  | "overdue";

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

export function getReminderEmailKey({
  dueDate,
  today,
  taskKey,
}: {
  dueDate: Date;
  today: Date;
  taskKey?: string | null;
}): ReminderEmailKey | null {
  const due = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysDiff = Math.floor((due - base) / (24 * 60 * 60 * 1000));

  if (daysDiff < 0) return "overdue";
  if (daysDiff === 0) return "today";

  const policy = classifyReminderPolicy(taskKey);

  switch (policy) {
    case "major":
      if (daysDiff === 30) return "30d_before";
      if (daysDiff === 14) return "14d_before";
      if (daysDiff === 7) return "7d_before";
      if (daysDiff === 3) return "3d_before";
      break;
    case "monthly":
      if (daysDiff === 7) return "7d_before";
      if (daysDiff === 3) return "3d_before";
      if (daysDiff === 1) return "1d_before";
      break;
    case "municipal":
      if (daysDiff === 14) return "14d_before";
      if (daysDiff === 7) return "7d_before";
      if (daysDiff === 1) return "1d_before";
      break;
    case "default":
      if (daysDiff === 7) return "7d_before";
      if (daysDiff === 1) return "1d_before";
      break;
  }

  return null;
}
