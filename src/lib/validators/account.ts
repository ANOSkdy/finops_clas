import { z } from "zod";

export const createUserSchema = z.object({
  loginId: z.string().min(1, "ログインIDは必須です"),
  name: z.string().min(1, "氏名は必須です"),
  password: z.string().min(8, "8文字以上で入力してください"),
  role: z.enum(["admin", "user"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
