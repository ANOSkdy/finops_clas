import { getSession } from "@/lib/auth/session";
import { CompanySelection } from "./CompanySelection";

export default async function SelectCompanyPage() {
  const session = await getSession();
  const companies = (session?.user.memberships ?? []).map(({ company, roleInCompany }) => ({
    id: company.id,
    name: company.name,
    legalForm: company.legalForm,
    representativeName: company.representativeName,
    email: company.email,
    roleInCompany,
    active: company.id === session?.activeCompanyId
  }));
  return <CompanySelection companies={companies} />;
}
