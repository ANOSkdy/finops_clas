import { ManualClient } from "@/app/(app)/manual/ManualClient";
import type { ManualDoc } from "@/lib/manual/docs";
import { getManualDocs } from "@/lib/manual/getManualDocs";

export const revalidate = 60;

export default async function ManualPage() {
  let docs: ManualDoc[] = [];

  try {
    docs = await getManualDocs("updatedAtDesc");
  } catch {
    docs = [];
  }

  return <ManualClient docs={docs} />;
}
