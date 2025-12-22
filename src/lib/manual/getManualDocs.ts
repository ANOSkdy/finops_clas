import { prisma } from "@/lib/db";
import type { ManualDoc } from "@/lib/manual/docs";

export type ManualDocSort = "updatedAtDesc" | "createdAtAsc";

export async function getManualDocs(
  sort: ManualDocSort = "updatedAtDesc"
): Promise<ManualDoc[]> {
  const orderBy =
    sort === "createdAtAsc" ? { createdAt: "asc" as const } : { updatedAt: "desc" as const };

  return prisma.manualDocument.findMany({
    orderBy,
    select: {
      slug: true,
      title: true,
      contentMd: true,
    },
  });
}
