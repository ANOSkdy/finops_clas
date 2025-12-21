export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function scoreFromUpload(meta: {
  originalFilename: string;
  mimeType: string;
  sizeBytes: bigint;
}) {
  const name = (meta.originalFilename || "").toLowerCase();
  const mime = meta.mimeType || "";

  let score = 62;

  // filename hints (very light)
  if (/(決算|financial|bs|pl|貸借|損益|試算|balance|income)/.test(name)) score += 8;

  // mime hints
  if (mime === "application/pdf") score += 4;
  if (mime.includes("csv") || mime.includes("excel") || mime.includes("spreadsheet")) score += 3;

  // size hints (avoid overfitting)
  const size = Number(meta.sizeBytes ?? BigInt(0));
  if (size >= 200_000) score += 2;
  if (size >= 1_500_000) score += 1;

  return clamp(score, 40, 90);
}

export function gradeFromScore(score: number) {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  return "C";
}
