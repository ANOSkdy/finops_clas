import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { getScheduleData } from "@/lib/tasks/list";
import { ScheduleView } from "./ScheduleView";

async function ScheduleContent() {
  const session = await getSession();
  const companyId = session?.activeCompanyId;
  const hasMembership = companyId ? session.user.memberships.some((membership) => membership.companyId === companyId) : false;
  if (!companyId || !hasMembership) return <ScheduleView initialData={null} initialNeedsCompany />;
  return <ScheduleView initialData={await getScheduleData(companyId)} />;
}

export default function SchedulePage() {
  return <Suspense fallback={<div className="route-loading-overlay" role="status" aria-label="読み込み中"><div className="route-loading-indicator"><span className="spinner" /></div></div>}><ScheduleContent /></Suspense>;
}
