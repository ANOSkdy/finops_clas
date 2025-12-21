"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { ErrorDetailsDialog } from "@/components/ui/ErrorDetailsDialog";
import { buildBlobPath } from "@/lib/uploads/path";
import { postJson } from "@/lib/ui/fetcher";

type ActiveCompanyResponse =
  | { company: { companyId: string; name: string } }
  | { error?: unknown };

type UploadPurpose = "rating" | "trial_balance";

type FinalizeRes = {
  score: number;
  grade: string;
  aiComment: string;
  highlights: Array<{ title: string; detail: string }>;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

async function sha256Hex(file: File): Promise<string | null> {
  const LIMIT = 20 * 1024 * 1024;
  if (file.size > LIMIT) return null;
  if (!globalThis.crypto?.subtle) return null;

  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function UploadPage() {
  const { toast } = useToast();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [needsCompany, setNeedsCompany] = useState(false);

  const [purpose, setPurpose] = useState<UploadPurpose>("rating");
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  const [result, setResult] = useState<{ fileId: string; url: string; reused: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
  const [finalize, setFinalize] = useState<FinalizeRes | null>(null);

  const [errOpen, setErrOpen] = useState(false);
  const [errText, setErrText] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      setNeedsCompany(false);
      try {
        const res = await fetch("/api/customer", { credentials: "include" });
        if (res.status === 404) { setNeedsCompany(true); return; }
        if (!res.ok) return;

        const json = (await res.json()) as ActiveCompanyResponse;
        // @ts-expect-error
        const c = json.company;
        if (c?.companyId) {
          setCompanyId(c.companyId);
          setCompanyName(c.name);
        }
      } catch {}
    })();
  }, []);

  const accept = useMemo(
    () => ".pdf,.csv,.xlsx,.xls,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    []
  );

  async function onUpload() {
    if (!companyId) { setNeedsCompany(true); return; }
    if (!file) {
      setError("ファイルを選択してください。");
      toast({ variant: "error", description: "ファイルを選択してください" });
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setFinalize(null);

    try {
      setProgressMsg("ハッシュ計算中…（小さなファイルのみ）");
      const hash = await sha256Hex(file);

      setProgressMsg("アップロード中…");
      const pathname = buildBlobPath({ companyId, purpose, originalFilename: file.name });

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/uploads/token",
        clientPayload: JSON.stringify({ purpose, originalFilename: file.name }),
      });

      setProgressMsg("完了処理中…（DB記録）");
      const complete = await postJson<{ fileId: string; url: string; reused: boolean }>("/api/uploads/complete", {
        purpose,
        originalFilename: file.name,
        sha256: hash,
        blob: {
          url: blob.url,
          pathname: (blob as any).pathname,
          contentType: (blob as any).contentType,
          size: file.size,
        },
      });

      if (!complete.ok) {
        toast({ variant: "error", title: "登録失敗", description: `HTTP ${complete.status}` });
        setErrText(complete.text);
        setErrOpen(true);
        setProgressMsg(null);
        return;
      }

      setResult(complete.data);
      setProgressMsg(null);
      toast({ variant: "success", title: "アップロード完了", description: `fileId: ${complete.data.fileId}` });
    } catch {
      setError("アップロードに失敗しました。Blob token / ログイン / 会社選択を確認してください。");
      setProgressMsg(null);
      toast({ variant: "error", title: "アップロード失敗", description: "Blob token / ログイン / 会社選択を確認してください" });
    } finally {
      setBusy(false);
    }
  }

  async function doFinalize() {
    if (!result?.fileId) return;
    setBusy(true);
    setProgressMsg("格付け中…（AIコメント生成）");
    setError(null);

    const res = await postJson<FinalizeRes>("/api/rating/finalize", { fileId: result.fileId });
    if (!res.ok) {
      toast({ variant: "error", title: "格付け失敗", description: `HTTP ${res.status}` });
      setErrText(res.text);
      setErrOpen(true);
      setProgressMsg(null);
      setBusy(false);
      setConfirmFinalizeOpen(false);
      return;
    }

    setFinalize(res.data);
    toast({ variant: "success", title: "格付け完了", description: `Grade ${res.data.grade} / Score ${res.data.score}` });
    setProgressMsg(null);
    setBusy(false);
    setConfirmFinalizeOpen(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">Upload</div>
        <div className="mt-1 text-sm text-inkMuted">ブラウザから直接Blobへアップロードします。</div>
      </div>

      {needsCompany && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">会社が選択されていません</div>
            <div className="mt-1 text-sm text-inkMuted">先に会社を選択してください。</div>
          </CardHeader>
          <CardContent>
            <a href="/selectcompany"><Button>会社を選択</Button></a>
          </CardContent>
        </Card>
      )}

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">設定</div>
          <div className="mt-1 text-sm text-inkMuted">Active: {companyName ?? "未選択"}</div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPurpose("rating")}
              className={`ring-focus tap-44 rounded-xl border px-3 py-2 text-sm ${
                purpose === "rating"
                  ? "border-primary bg-primary text-white shadow-softSm"
                  : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
              }`}
            >
              格付け（rating）
            </button>
            <button
              type="button"
              onClick={() => setPurpose("trial_balance")}
              className={`ring-focus tap-44 rounded-xl border px-3 py-2 text-sm ${
                purpose === "trial_balance"
                  ? "border-primary bg-primary text-white shadow-softSm"
                  : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
              }`}
            >
              試算表（trial_balance）
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-base p-4">
            <div className="text-sm font-medium">ファイル</div>
            <div className="mt-2 flex items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                className="ring-focus tap-44 w-full rounded-xl border border-line bg-white/90 px-3 py-2 text-sm text-ink"
                accept={accept}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={busy}
              />
              <Button
                variant="secondary"
                onClick={() => { setFile(null); setResult(null); setFinalize(null); if (inputRef.current) inputRef.current.value = ""; }}
                disabled={busy}
              >
                クリア
              </Button>
            </div>
            <div className="mt-2 text-xs text-inkMuted">
              {file ? `${file.name} (${formatBytes(file.size)})` : "未選択"}
            </div>
          </div>

          {progressMsg && (
            <div className="rounded-2xl border border-line bg-base px-4 py-3 text-sm text-ink">
              {progressMsg}
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-2xl border border-accent2/35 bg-accent2/10 px-4 py-3 text-sm text-ink">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-secondary/40 bg-secondary/15 px-4 py-3 text-sm text-ink">
              <div>fileId = {result.fileId}{result.reused ? "（既存再利用）" : ""}</div>
              <div className="mt-1 break-all text-xs opacity-90">url: {result.url}</div>
            </div>
          )}

          <Button onClick={onUpload} disabled={busy || !file}>
            {busy ? "処理中…" : "アップロード"}
          </Button>

          {purpose === "rating" && result?.fileId && (
            <div className="pt-2">
              <Button variant="secondary" onClick={() => setConfirmFinalizeOpen(true)} disabled={busy}>
                格付けを実行（コメント生成）
              </Button>
            </div>
          )}

          <div className="text-xs text-inkMuted">
            ※ Blobは public URL です。外部にURLを共有しない運用にしてください。
          </div>
        </CardContent>
      </Card>

      {finalize && (
        <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">格付け結果</div>
          <div className="mt-1 text-sm text-inkMuted">Score / Grade / AI comment</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-line bg-base px-4 py-3 text-sm">
              <div className="text-xs text-inkMuted">Grade</div>
              <div className="text-xl font-semibold">{finalize.grade}</div>
            </div>
            <div className="rounded-2xl border border-line bg-base px-4 py-3 text-sm">
              <div className="text-xs text-inkMuted">Score</div>
              <div className="text-xl font-semibold">{finalize.score}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-base px-4 py-4">
            <div className="text-sm font-medium">AI Comment</div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-ink">{finalize.aiComment}</pre>
          </div>

            {finalize.highlights?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Highlights</div>
                {finalize.highlights.map((h, idx) => (
                  <div key={idx} className="rounded-2xl border border-line bg-base px-4 py-3">
                    <div className="text-sm font-semibold">{h.title}</div>
                    <div className="mt-1 text-sm text-inkMuted">{h.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmFinalizeOpen} onOpenChange={setConfirmFinalizeOpen}>
        <DialogContent>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>格付けを実行しますか？</DialogTitle>
              <DialogDescription>
                fileId を用いてスコア・グレード・AIコメントを生成します。
              </DialogDescription>
          </div>
          <DialogClose asChild>
            <button className="ring-focus tap-44 rounded-xl px-2 text-sm text-inkMuted" type="button" aria-label="閉じる">✕</button>
          </DialogClose>
        </div>

          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="secondary" type="button" disabled={busy}>キャンセル</Button>
            </DialogClose>
            <Button type="button" onClick={doFinalize} disabled={busy}>
              {busy ? "処理中…" : "実行"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ErrorDetailsDialog open={errOpen} onOpenChange={setErrOpen} details={errText} />
    </div>
  );
}
