import { AppError } from "./errors";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) throw new AppError("FORBIDDEN", "この操作は許可されていません", 403);
  const expected = new URL(request.url).origin;
  if (origin !== expected) throw new AppError("FORBIDDEN", "この操作は許可されていません", 403);
}
