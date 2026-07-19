import { requireActiveCompany } from "@/lib/auth/session";
import { listManualProcedures } from "@/lib/manual/procedures";
import { ManualGrid } from "./ManualGrid";

export const dynamic = "force-dynamic";

export default async function ManualPage() {
  const context = await requireActiveCompany();
  const procedures = await listManualProcedures(context.companyId);
  return <ManualGrid initialProcedures={procedures} />;
}
