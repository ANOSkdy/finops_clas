export const SCORE_VERSION = "metadata-v1";

export function calculateRatingScore(input: { fileName: string; mimeType: string; size: number }) {
  let score = 62;
  if (/(決算|financial|bs|pl|貸借|損益|試算|balance|income)/i.test(input.fileName)) score += 8;
  if (input.mimeType === "application/pdf") score += 4;
  if (["text/csv", "application/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(input.mimeType)) score += 3;
  if (input.size >= 200_000) score += 2;
  if (input.size >= 1_500_000) score += 1;
  score = Math.max(40, Math.min(90, score));
  return { score, grade: score >= 80 ? "A" : score >= 65 ? "B" : "C" };
}
