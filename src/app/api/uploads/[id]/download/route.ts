import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { AppError } from "@/lib/api/errors";
import { withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { readPrivateObject } from "@/lib/uploads/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiError(async () => {
    const context = await requireActiveCompany();
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new AppError("NOT_FOUND", "書類が見つかりません", 404);
    const upload = await db.upload.findFirst({ where: { id, companyId: context.companyId } });
    if (!upload) throw new AppError("NOT_FOUND", "書類が見つかりません", 404);
    const content = await readPrivateObject(upload.storageKey);
    const safeName = upload.originalName.replace(/["\r\n]/g, "_");
    return new NextResponse(content, { headers: { "content-type": upload.mimeType, "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  });
}
