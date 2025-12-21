export function sanitizeFilename(name: string): string {
  // keep ascii-ish, keep dot/underscore/hyphen
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  // avoid extremely long names
  return cleaned.slice(0, 120) || "file";
}

export function buildBlobPath(params: {
  companyId: string;
  purpose: "rating" | "trial_balance";
  originalFilename: string;
  isoDate?: string; // YYYY-MM-DD
}) {
  const date = params.isoDate ?? new Date().toISOString().slice(0, 10);
  const fn = sanitizeFilename(params.originalFilename);
  return `${params.companyId}/${params.purpose}/${date}/${fn}`;
}

export function isSafePathname(pathname: string) {
  if (!pathname) return false;
  if (pathname.includes("..")) return false;
  if (pathname.startsWith("/")) return false;
  return true;
}