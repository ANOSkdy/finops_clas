"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/toast";
import { MANUAL_DOCS } from "@/lib/manual/docs";

function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[#>*_\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ManualPage() {
  const { toast } = useToast();

  const [slug, setSlug] = useState(MANUAL_DOCS[0]?.slug ?? "");
  const [maxLength, setMaxLength] = useState(600);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const doc = useMemo(
    () => MANUAL_DOCS.find((d) => d.slug === slug) ?? MANUAL_DOCS[0],
    [slug]
  );
  const contentText = useMemo(() => stripMarkdown(doc?.contentMd ?? ""), [doc]);

  async function onSummarize() {
    try {
      setBusy(true);
      setError(null);
      setSummary("");

      const res = await fetch("/api/ai/manual_summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: contentText, maxLength }),
      });

      if (!res.ok) throw new Error("ai_failed");
      const json = (await res.json()) as { summary: string };
      setSummary(json.summary || "");
      toast({ variant: "success", title: "要約完了", description: "要約結果を表示しました" });
    } catch {
      setError("要約に失敗しました（Gemini key / ネットワーク）を確認してください。");
      toast({ variant: "error", title: "要約失敗", description: "Gemini key / ネットワークを確認してください" });
    } finally {
      setBusy(false);
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(summary);
      toast({ variant: "success", description: "コピーしました" });
    } catch {
      toast({ variant: "error", description: "コピーに失敗しました" });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">Manual</div>
        <div className="mt-1 text-sm text-inkMuted">
          目次から選択して閲覧し、必要ならAI要約します。
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="text-base font-semibold">目次</div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {MANUAL_DOCS.map((d) => (
              <button
                key={d.slug}
                className={`ring-focus rounded-xl border px-3 py-2 text-sm ${
                  d.slug === slug
                    ? "border-primary bg-primary/20 text-primary shadow-softSm"
                    : "border-primary/50 bg-base text-primary hover:bg-primary/10"
                }`}
                onClick={() => {
                  setSlug(d.slug);
                  setSummary("");
                  setError(null);
                }}
              >
                {d.title}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base font-semibold">{doc?.title}</div>
            <div className="mt-1 text-sm text-inkMuted">本文（v1：ローカル同梱）</div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-ink">
              {doc?.contentMd.trim()}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">AI要約</div>
              <div className="mt-1 text-sm text-inkMuted">
                AI出力はプレーンテキスト表示（HTMLとして扱わない）
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={200}
                max={2000}
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                className="w-24"
              />
              <Button onClick={onSummarize} disabled={busy}>
                {busy ? "要約中…" : "要約する"}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {error && (
              <div role="alert" className="rounded-2xl border border-accent2/35 bg-accent2/10 px-4 py-3 text-sm text-ink">
                {error}
              </div>
            )}

            {summary ? (
              <>
                <pre className="whitespace-pre-wrap text-sm text-ink">{summary}</pre>
                <div>
                  <Button variant="secondary" onClick={onCopy}>
                    コピー
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-inkMuted">要約結果はここに表示されます。</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
