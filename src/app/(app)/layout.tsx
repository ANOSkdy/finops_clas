import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const memberships = [...session.user.memberships].sort((a, b) => a.company.name.localeCompare(b.company.name, "ja"));
  return <AppShell user={{ name: session.user.name, role: session.user.role }} activeCompanyId={session.activeCompanyId} companies={memberships.map(({ company, roleInCompany }) => ({ id: company.id, name: company.name, legalForm: company.legalForm, roleInCompany }))}>{children}</AppShell>;
}
