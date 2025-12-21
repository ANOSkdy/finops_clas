export type RoleInCompany = "owner" | "admin" | "member" | "accountant";

export function canEditCompany(roleInCompany?: string | null) {
  return roleInCompany === "owner" || roleInCompany === "admin";
}