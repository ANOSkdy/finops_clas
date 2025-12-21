import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/tenant";
import { manualSummarySchema } from "@/lib/validators/manual";
import { summarizeManual } from "@/lib/ai/manualSummary";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = manualSummarySchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const { content, maxLength } = parsed.data;
  const out = await summarizeManual({ content, maxLength });

  // spec: res { summary }:contentReference[oaicite:8]{index=8}
  return jsonOk({ summary: out.summary });
}