import { NextResponse } from "next/server";

export const runtime = "nodejs";

function sanitize(msg: string) {
  return msg.replace(/postgres(ql)?:\/\/[^ \n\r\t]+/g, "postgres://***");
}

export async function GET() {
  try {
    const { prisma } = await import("@/lib/db");
    const n = await prisma.user.count();
    return NextResponse.json({ ok: true, userCount: n });
  } catch (e: unknown) {
    const message = sanitize(e instanceof Error ? (e.stack || e.message) : String(e));
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}