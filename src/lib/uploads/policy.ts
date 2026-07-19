import { extname } from "node:path";
import { AppError } from "@/lib/api/errors";

export const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
export const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
export type UploadPurpose = "rating" | "trial_balance";

export function sanitizeFileName(name: string) {
  const base = name.replace(/^.*[\\/]/, "").normalize("NFKC");
  const safe = base.replace(/[^\p{L}\p{N}._ -]/gu, "_").replace(/\.{2,}/g, ".").trim();
  if (!safe || safe === "." || safe.length > 200) throw new AppError("VALIDATION_ERROR", "ファイル名が正しくありません", 400);
  return safe;
}

export function validateUploadMetadata(purpose: UploadPurpose, fileName: string, mimeType: string, size: number) {
  const safeName = sanitizeFileName(fileName);
  if (!ALLOWED_MIME.has(mimeType)) throw new AppError("VALIDATION_ERROR", "対応していないファイル形式です", 400);
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) throw new AppError("VALIDATION_ERROR", "ファイルサイズが上限を超えています", 400);
  const extension = extname(safeName).toLowerCase();
  const allowedExtensions = purpose === "rating" ? [".pdf", ".csv", ".xls", ".xlsx"] : [".csv", ".xls", ".xlsx"];
  if (!allowedExtensions.includes(extension)) throw new AppError("VALIDATION_ERROR", "この処理では選択できないファイル形式です", 400);
  const mimeByExtension: Record<string, readonly string[]> = {
    ".pdf": ["application/pdf"],
    ".csv": ["text/csv", "application/csv", "application/vnd.ms-excel"],
    ".xls": ["application/vnd.ms-excel"],
    ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
  };
  if (!mimeByExtension[extension]?.includes(mimeType)) throw new AppError("VALIDATION_ERROR", "拡張子とファイル形式が一致しません", 400);
  return safeName;
}

export function validateFileSignature(fileName: string, bytes: Uint8Array) {
  const extension = extname(fileName).toLowerCase();
  const begins = (...expected: number[]) => expected.every((value, index) => bytes[index] === value);
  const valid = extension === ".pdf"
    ? begins(0x25, 0x50, 0x44, 0x46, 0x2d)
    : extension === ".xlsx"
      ? begins(0x50, 0x4b, 0x03, 0x04)
      : extension === ".xls"
        ? begins(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)
        : extension === ".csv" && !bytes.subarray(0, Math.min(bytes.length, 8192)).includes(0);
  if (!valid) throw new AppError("VALIDATION_ERROR", "ファイルの内容と形式が一致しません", 400);
}

export function storageKey(companyId: string, purpose: UploadPurpose, fileName: string, now = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const nonce = crypto.randomUUID();
  return `companies/${companyId}/${purpose}/${day}/${nonce}-${sanitizeFileName(fileName)}`;
}
