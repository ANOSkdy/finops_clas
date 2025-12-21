import { GoogleGenAI, Type } from "@google/genai";

export type RatingHighlight = { title: string; detail: string };

function fallback() {
  const highlights: RatingHighlight[] = [
    {
      title: "提出資料の整備",
      detail: "PL/BS/（可能ならCF）を揃え、売上・利益・自己資本・借入金など主要項目を月次/期次で整理してください。",
    },
    {
      title: "資金繰りと返済計画",
      detail: "今後6〜12ヶ月の資金繰り見通し、返済スケジュール、運転資金の必要額を作成してください。",
    },
    {
      title: "説明資料の作成",
      detail: "事業概要・強み・リスク・改善施策をA4 1〜2枚に要約し、根拠のある範囲で定量を提示してください。",
    },
  ];

  const aiComment = [
    "※このコメントは提出ファイルの内容を全文解析した断定ではなく、融資・格付け観点の一般的な助言です。",
    "改善アクション（3点）",
    "1) 主要財務（売上・利益・自己資本・借入金）を整理し、変動要因を説明できる状態にする",
    "2) 資金繰り表と返済計画を作成し、返済余力の根拠を示す",
    "3) 事業の強み/リスク/対策を短い資料にまとめ、金融機関の確認ポイントに先回りする",
  ].join("\n");

  return { aiComment, highlights };
}

function getApiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) return null;
  return k;
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export async function generateRatingComment(params: {
  companyName?: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: string;
}) {
  const apiKey = getApiKey();
  if (!apiKey) return fallback();

  const ai = new GoogleGenAI({ apiKey });

  const prompt = [
    "あなたは融資・格付け観点のアドバイザーです。",
    "断定しない。根拠のない数値は出さない。",
    "提出物の内容を全文解析していない前提で、一般的助言として書く。",
    "改善アクションを3点、必ず具体的に提示する。",
    "",
    "入力（最小メタ情報）:",
    `- companyName: ${params.companyName ?? "unknown"}`,
    `- filename: ${params.originalFilename}`,
    `- mimeType: ${params.mimeType}`,
    `- sizeBytes: ${params.sizeBytes}`,
  ].join("\n");

  const schema = {
    type: Type.OBJECT,
    properties: {
      aiComment: { type: Type.STRING },
      highlights: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            detail: { type: Type.STRING },
          },
          propertyOrdering: ["title", "detail"],
        },
      },
    },
    propertyOrdering: ["aiComment", "highlights"],
  };

  // short timeout (Flash latency assumption)
  const timeoutMs = 8000;
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error("gemini_timeout")), timeoutMs)
  );

  try {
    const resp: any = await Promise.race([
      ai.models.generateContent({
        model: getModel(),
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
      timeout,
    ]);

    const text: string =
      resp?.text ??
      resp?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "";

    const json = JSON.parse(text);
    const aiComment = typeof json.aiComment === "string" ? json.aiComment : fallback().aiComment;
    const highlightsRaw = Array.isArray(json.highlights) ? json.highlights : fallback().highlights;

    const highlights: RatingHighlight[] = highlightsRaw
      .map((h: any) => ({
        title: String(h?.title ?? "").slice(0, 80) || "ポイント",
        detail: String(h?.detail ?? "").slice(0, 400) || "",
      }))
      .filter((h: RatingHighlight) => h.detail.length > 0)
      .slice(0, 5);

    return {
      aiComment,
      highlights: highlights.length ? highlights : fallback().highlights,
    };
  } catch {
    return fallback();
  }
}