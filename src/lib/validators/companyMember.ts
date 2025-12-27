import { z } from "zod";

export const companyMemberCreateSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
  roleInCompany: z.enum(["owner", "admin", "member", "accountant"]).optional().default("member"),
});

export type CompanyMemberCreateInput = z.infer<typeof companyMemberCreateSchema>;
