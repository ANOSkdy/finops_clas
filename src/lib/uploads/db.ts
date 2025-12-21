import { prisma } from "@/lib/db";
import type { UploadPurpose } from "@/lib/validators/uploads";

type MinimalBlob = {
  url: string;
  pathname?: string;
  contentType?: string;
  size?: number;
};

function filenameFromPath(pathname?: string) {
  if (!pathname) return null;
  const parts = pathname.split("/");
  return parts[parts.length - 1] || null;
}

export async function upsertUploadFromBlob(params: {
  companyId: string;
  userId: string;
  purpose: UploadPurpose;
  blob: MinimalBlob;
  originalFilename?: string | null;
  sha256?: string | null;
}) {
  const storageProvider = "vercel_blob";
  const storageKey = params.blob.url;

  const existing = await prisma.upload.findFirst({
    where: {
      companyId: params.companyId,
      storageProvider,
      storageKey,
    },
    select: { id: true },
  });

  if (existing) return { fileId: existing.id, reused: true as const };

  const mimeType = params.blob.contentType || "application/octet-stream";
  const sizeBytesNum = typeof params.blob.size === "number" ? params.blob.size : 0;

  const created = await prisma.upload.create({
    data: {
      companyId: params.companyId,
      userId: params.userId,
      purpose: params.purpose,
      storageProvider,
      storageKey,
      originalFilename:
        params.originalFilename ||
        filenameFromPath(params.blob.pathname) ||
        "file",
      mimeType,
      sizeBytes: BigInt(sizeBytesNum),
      sha256: params.sha256 ?? null,
    },
    select: { id: true },
  });

  return { fileId: created.id, reused: false as const };
}