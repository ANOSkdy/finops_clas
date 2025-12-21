import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const envName = process.env.STORAGE_BLOB_TOKEN_ENV || "BLOB_READ_WRITE_TOKEN";
  return NextResponse.json({
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    has_DATABASE_URL: !!process.env.DATABASE_URL,
    has_DIRECT_URL: !!process.env.DIRECT_URL,
    has_AUTH_SESSION_SECRET: !!process.env.AUTH_SESSION_SECRET,
    blobTokenEnvName: envName,
    has_BLOB_TOKEN: !!process.env[envName],
  });
}