import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { clientAddress, enforceRateLimit } from "@/lib/auth/rate-limit";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { assertSameOrigin } from "@/lib/api/origin";

export const runtime = "nodejs";
const schema = z.object({ loginId: z.string().trim().min(1).max(100), password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    enforceRateLimit(`login:${clientAddress(request)}`, 10, 15 * 60_000);
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const user = await db.user.findUnique({ where: { loginId: parsed.data.loginId } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      throw new AppError("UNAUTHORIZED", "ログインIDまたはパスワードが正しくありません", 401);
    }
    await createSession(user.id);
    return new NextResponse(null, { status: 204 });
  });
}
