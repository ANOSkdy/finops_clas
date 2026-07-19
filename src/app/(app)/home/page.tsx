import { getSession } from "@/lib/auth/session";
import { getHomeSummary } from "@/lib/home/summary";
import { HomeDashboard } from "./HomeDashboard";

export default async function HomePage() {
  const session = await getSession();
  const companyId = session?.activeCompanyId;
  const hasMembership = companyId ? session.user.memberships.some((membership) => membership.companyId === companyId) : false;
  if (!companyId || !hasMembership) return <HomeDashboard needsCompany />;
  return <HomeDashboard data={await getHomeSummary(companyId)} />;
}
