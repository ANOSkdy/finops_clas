import { db } from "@/lib/db";

export const manualCategories = ["tax", "social_insurance", "registration"] as const;
export const manualStatuses = ["not_started", "in_progress", "completed"] as const;
export type ManualCategory = (typeof manualCategories)[number];
export type ManualStatus = (typeof manualStatuses)[number];

export type ManualProcedureRow = {
  id: string;
  category: ManualCategory;
  title: string;
  trigger: string;
  deadline: string;
  submissionDestination: string | null;
  cost: string | null;
  notes: string;
  status: ManualStatus;
  custom: boolean;
};

const categoryOrder = new Map<ManualCategory, number>(manualCategories.map((category, index) => [category, index]));

export async function listManualProcedures(companyId: string): Promise<ManualProcedureRow[]> {
  const procedures = await db.manualProcedure.findMany({
    where: { OR: [{ companyId: null }, { companyId }] },
    include: {
      companyStatuses: {
        where: { companyId },
        select: { status: true }
      }
    }
  });

  return procedures
    .sort((a, b) => {
      const categoryDifference = (categoryOrder.get(a.category as ManualCategory) ?? 99) - (categoryOrder.get(b.category as ManualCategory) ?? 99);
      if (categoryDifference !== 0) return categoryDifference;
      if (a.position !== b.position) return a.position - b.position;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((procedure) => ({
      id: procedure.id,
      category: procedure.category as ManualCategory,
      title: procedure.title,
      trigger: procedure.trigger,
      deadline: procedure.deadline,
      submissionDestination: procedure.submissionDestination,
      cost: procedure.cost,
      notes: procedure.notes,
      status: (procedure.companyStatuses[0]?.status ?? "not_started") as ManualStatus,
      custom: procedure.companyId !== null
    }));
}
