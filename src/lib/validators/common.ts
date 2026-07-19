import { z } from "zod";

export const uuidSchema = z.uuid();
export const emailSchema = z.email().max(254);
export const moneyStringSchema = z.string().regex(/^\d+$/).max(19).refine((value) => BigInt(value) <= 9_223_372_036_854_775_807n, { message: "金額が上限を超えています" });
export const roleSchema = z.enum(["user", "admin", "global"]);
export const companyRoleSchema = z.enum(["owner", "admin", "member", "accountant"]);
