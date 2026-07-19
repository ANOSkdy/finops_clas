import { addDays, fromDateUtc, todayInTokyo } from "@/lib/date/business-date";
import { db } from "@/lib/db";

export type HomeSummary = {
  today: string;
  counts: { overdue: number; today: number; within7Days: number; within30Days: number };
  tasks: { id: string; title: string; category: string; dueDate: string; status: "overdue" | "pending" }[];
  totalTasks: number;
};

export async function getHomeSummary(companyId: string): Promise<HomeSummary> {
  const today = todayInTokyo();
  const end = addDays(today, 30);
  const tasks = await db.task.findMany({
    where: { companyId, status: { not: "done" }, dueDate: { lte: new Date(`${end}T00:00:00Z`) } },
    select: { id: true, title: true, category: true, dueDate: true },
    orderBy: { dueDate: "asc" }
  });
  const rows = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    category: task.category,
    dueDate: fromDateUtc(task.dueDate),
    status: (fromDateUtc(task.dueDate) < today ? "overdue" : "pending") as "overdue" | "pending"
  }));
  const counts = { overdue: 0, today: 0, within7Days: 0, within30Days: 0 };
  for (const row of rows) {
    if (row.dueDate < today) counts.overdue += 1;
    else {
      if (row.dueDate === today) counts.today += 1;
      if (row.dueDate <= addDays(today, 7)) counts.within7Days += 1;
      counts.within30Days += 1;
    }
  }
  return { today, counts, tasks: rows.slice(0, 8), totalTasks: rows.length };
}
