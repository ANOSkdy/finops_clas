import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { ManualDoc, ManualDocListItem } from "@/lib/manual/docs";

export type ManualDocSort = "updatedAtDesc" | "createdAtAsc";

export const MANUAL_CACHE_TAG = "manual";

const getManualDocsCached = unstable_cache(
  async (sort: ManualDocSort): Promise<ManualDocListItem[]> => {
    const orderBy =
      sort === "createdAtAsc" ? { createdAt: "asc" as const } : { updatedAt: "desc" as const };

    return prisma.manualDocument.findMany({
      orderBy,
      select: {
        slug: true,
        title: true,
      },
    });
  },
  ["manual-docs"],
  { revalidate: 60, tags: [MANUAL_CACHE_TAG] }
);

export async function getManualDocs(
  sort: ManualDocSort = "updatedAtDesc"
): Promise<ManualDocListItem[]> {
  return getManualDocsCached(sort);
}

export async function getManualDocBySlug(slug: string): Promise<ManualDoc | null> {
  return prisma.manualDocument.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      contentMd: true,
    },
  });
}
