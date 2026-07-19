import { NextResponse } from "next/server";
import { deleteCurrentSession } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { withApiError } from "@/lib/api/response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withApiError(async () => {
    assertSameOrigin(request);
    await deleteCurrentSession();
    return new NextResponse(null, { status: 204 });
  });
}
