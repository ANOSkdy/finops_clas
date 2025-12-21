import { NextResponse } from "next/server";

export const runtime = "nodejs";

function sanitize(msg: string) {
  return msg.replace(/postgres(ql)?:\/\/[^ \n\r\t]+/g, "postgres://***");
}

export async function GET() {
  try {
    const mod = await import("@/lib/db");
    const prisma = (mod as any).prisma;
    const n = await prisma.user.count();
    return NextResponse.json({ ok: true, userCount: n });
  } catch (e: any) {
    const message = sanitize(String(e?.stack || e?.message || e));
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}