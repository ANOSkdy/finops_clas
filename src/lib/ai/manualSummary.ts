import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

function hashKey(content: string, maxLength: number) {
  return crypto.createHash("sha256").update(content).update("|").update(String(maxLength)).digest("hex");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fallbackSummary(content: string, maxLength: number) {
  const text = content.replace(/\s+/g, " ").trim();
  const cut = text.slice(0, maxLength);
  return cut.length < text.length ? cut + "…" : cut;
}

export async function summarizeManual(params: { content: string; maxLength: number }) {
  const maxLength = clamp(params.maxLength, 200, 2000);
  const content = params.content.slice(0, 20000); // prompt input limit (spec suggests 8k–20k chars):contentReference[oaicite:7]{index=7}

  const key = hashKey(content, maxLength);

  const cached = await prisma.aiCache.findUnique({ where: { key } });
  if (cached) return { summary: cached.value, cacheHit: true as const };

  // Gemini (server-only)
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  let summary = "";
  if (!apiKey) {
    summary = fallbackSummary(content, maxLength);
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = [
        "日本語で要約してください。箇条書き中心。専門用語は必要に応じて補足。",
        `最大${maxLength}文字程度。断定しすぎず、手順/要点が分かる形で。`,
        "",
        "内容:",
        content,
      ].join("\n");

      const resp: any = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const text: string =
        resp?.text ??
        resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "";

      summary = (text || "").trim();
      if (!summary) summary = fallbackSummary(content, maxLength);
      if (summary.length > maxLength) summary = summary.slice(0, maxLength) + "…";
    } catch {
      summary = fallbackSummary(content, maxLength);
    }
  }

  await prisma.aiCache.upsert({
    where: { key },
    update: { value: summary, updatedAt: new Date() },
    create: { key, value: summary },
  });

  return { summary, cacheHit: false as const };
}