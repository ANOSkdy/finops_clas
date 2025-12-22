import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { ManualDoc } from "@/lib/manual/docs";

export type ManualDocSort = "updatedAtDesc" | "createdAtAsc";

export const MANUAL_CACHE_TAG = "manual";

const getManualDocsCached = unstable_cache(
  async (sort: ManualDocSort): Promise<ManualDoc[]> => {
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
  },
  ["manual-docs"],
  { revalidate: 60, tags: [MANUAL_CACHE_TAG] }
);

export async function getManualDocs(
  sort: ManualDocSort = "updatedAtDesc"
): Promise<ManualDoc[]> {
  return getManualDocsCached(sort);
}
