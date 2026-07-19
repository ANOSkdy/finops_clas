import type { DateOnly } from "@/lib/date/business-date";
import { fromDateUtc, todayInTokyo, toUtcDate } from "@/lib/date/business-date";
import { JAPAN_HOLIDAY_CALENDAR } from "@/lib/date/japan-holidays";
import { db } from "@/lib/db";
import { visibleTaskStatus } from "@/lib/tasks/status";

export type ScheduleFilters = {
  category?: "tax" | "labor" | "other";
  status?: "pending" | "overdue" | "done";
  from?: DateOnly;
  to?: DateOnly;
};

export type ScheduleData = {
  today: DateOnly;
  tasks: Array<{
    id: string;
    title: string;
    category: string;
    dueDate: DateOnly;
    periodStart: DateOnly | null;
    periodEnd: DateOnly | null;
    status: "pending" | "overdue" | "done";
  }>;
  rule: { version: string; holidayCoverageEnd: string };
};

export async function getScheduleData(companyId: string, filters: ScheduleFilters = {}): Promise<ScheduleData> {
  const tasks = await db.task.findMany({
    where: {
      companyId,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.from || filters.to ? {
        dueDate: {
          ...(filters.from ? { gte: toUtcDate(filters.from) } : {}),
          ...(filters.to ? { lte: toUtcDate(filters.to) } : {})
        }
      } : {})
    },
    select: { id: true, title: true, category: true, dueDate: true, periodStart: true, periodEnd: true, status: true },
    orderBy: [{ dueDate: "asc" }, { title: "asc" }]
  });
  const today = todayInTokyo();
  const serialized = tasks.map((item) => ({
    ...item,
    dueDate: fromDateUtc(item.dueDate),
    periodStart: item.periodStart ? fromDateUtc(item.periodStart) : null,
    periodEnd: item.periodEnd ? fromDateUtc(item.periodEnd) : null,
    status: visibleTaskStatus(item.status, item.dueDate, today) as "pending" | "overdue" | "done"
  }));
  return {
    today,
    tasks: filters.status ? serialized.filter((item) => item.status === filters.status) : serialized,
    rule: { version: `clas-${JAPAN_HOLIDAY_CALENDAR.version}`, holidayCoverageEnd: JAPAN_HOLIDAY_CALENDAR.effectiveTo }
  };
}
