import { z } from "zod";

const responseSchema = z.object({ aiComment: z.string().min(1).max(2000), highlights: z.array(z.string().min(1).max(300)).max(6) });
const fallback = {
  aiComment: "資金繰り表を定期的に更新し、売上債権の回収状況と固定費の推移を継続して確認してください。",
  highlights: ["月次の資金繰りを可視化する", "売上債権の回収期間を確認する", "固定費と利益率の推移を比較する"],
  source: "fallback" as const,
  model: null
};

export async function createRatingAdvisory(input: { companyName: string; fileName: string; mimeType: string; size: number }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: `日本語で一般的な改善助言をJSONのみで返してください。会社名:${input.companyName}\nファイル名:${input.fileName}\nMIME:${input.mimeType}\nサイズ:${input.size}\nファイル本文は提供されていません。形式:{"aiComment":"...","highlights":["..."]}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    if (!response.ok) return fallback;
    const raw: unknown = await response.json();
    const text = extractGeminiText(raw);
    const parsed = responseSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return fallback;
    return { ...parsed.data, source: "gemini" as const, model };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

function extractGeminiText(value: unknown) {
  const parsed = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string() })) }) })).min(1) }).parse(value);
  return parsed.candidates[0].content.parts[0].text;
}
