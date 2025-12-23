import { z } from "zod";

export const createUserSchema = z.object({
  loginId: z.string().min(1, "ログインIDは必須です").trim(),
  password: z.string().min(8, "パスワードは8文字以上です"),
  name: z.string().min(1, "名前は必須です"),
  role: z.enum(["admin", "user"]).optional().default("user"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
