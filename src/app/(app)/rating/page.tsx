"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { ErrorDetailsDialog } from "@/components/ui/ErrorDetailsDialog";
import { buildBlobPath } from "@/lib/uploads/path";
import { postJson } from "@/lib/ui/fetcher";

type FinalizeRes = {
  score: number;
  grade: string;
  aiComment: string;
  highlights: Array<{ title: string; detail: string }>;
};

type ActiveCompanyResponse =
  | { company: { companyId: string; name: string } }
  | { error?: unknown };

async function sha256Hex(file: File): Promise<string | null> {
  const LIMIT = 20 * 1024 * 1024;
  if (file.size > LIMIT) return null;
  if (!globalThis.crypto?.subtle) return null;
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function RatingPage() {
  const { toast } = useToast();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [needsCompany, setNeedsCompany] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"idle"|"uploading"|"uploaded"|"finalizing"|"done"|"error">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<FinalizeRes | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
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

  async function finalizeWithId(id: string) {
    setStage("finalizing");
    setMsg("格付け中…（AIコメント生成）");
    setResult(null);

    const res = await postJson<FinalizeRes>("/api/rating/finalize", { fileId: id });
    if (!res.ok) {
      toast({ variant: "error", title: "格付け失敗", description: `HTTP ${res.status}` });
      setErrText(res.text);
      setErrOpen(true);
      setStage("error");
      setMsg(null);
      return;
    }

    setResult(res.data);
    setStage("done");
    setMsg(null);
    toast({ variant: "success", title: "格付け完了", description: `グレード ${res.data.grade} / スコア ${res.data.score}` });
  }

  async function onUploadAndFinalize() {
    if (!companyId) { setNeedsCompany(true); return; }
    if (!file) {
      toast({ variant: "error", description: "ファイルを選択してください" });
      return;
    }

    setBusy(true);
    setStage("uploading");
    setMsg("アップロード準備中…");
    setResult(null);

    try {
      setMsg("ハッシュ計算中…（小さなファイルのみ）");
      const hash = await sha256Hex(file);

      setMsg("アップロード中…");
      const pathname = buildBlobPath({ companyId, purpose: "rating", originalFilename: file.name });

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/uploads/token",
        clientPayload: JSON.stringify({ purpose: "rating", originalFilename: file.name }),
      });

      setMsg("完了処理中…（DB記録）");
      const complete = await postJson<{ fileId: string }>("/api/uploads/complete", {
        purpose: "rating",
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
        setStage("error");
        setMsg(null);
        return;
      }

      setFileId(complete.data.fileId);
      setStage("uploaded");
      toast({ variant: "success", title: "アップロード完了", description: `ファイルID: ${complete.data.fileId}` });

      await finalizeWithId(complete.data.fileId);
    } catch {
      toast({ variant: "error", title: "失敗", description: "アップロードまたは格付けに失敗しました" });
      setStage("error");
      setMsg(null);
    } finally {
      setBusy(false);
    }
  }

  function openConfirm() {
    if (!companyId) { setNeedsCompany(true); return; }
    if (!file && !fileId) {
      toast({ variant: "error", description: "ファイルまたはファイルIDを指定してください" });
      return;
    }
    setConfirmOpen(true);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">格付け</div>
        <div className="mt-1 text-sm text-inkMuted">
          決算書をアップロードし、スコア・グレード・AIコメントを表示します。
        </div>
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
          <div className="text-base font-semibold">入力</div>
          <div className="mt-1 text-sm text-inkMuted">選択中: {companyName ?? "未選択"}</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            className="ring-focus tap-44 w-full rounded-xl border border-line bg-white/90 px-3 py-2 text-sm text-ink"
            accept={accept}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />

          <Field
            label="既存のファイルID（任意）"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            disabled={busy}
            hint="アップロード済みのファイルIDがあれば直接格付けできます"
          />

          {msg && (
            <div className="rounded-2xl border border-line bg-base px-4 py-3 text-sm text-ink">
              {msg}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={openConfirm} disabled={busy}>
              {busy ? "処理中…" : "実行（確認）"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setFile(null); setFileId(""); setResult(null); setStage("idle"); if (inputRef.current) inputRef.current.value = ""; }}
              disabled={busy}
            >
              クリア
            </Button>
          </div>

          <div className="text-xs text-inkMuted">
            ※ Blobは public URL です。URLを外部共有しない運用にしてください。
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">結果</div>
          <div className="mt-1 text-sm text-inkMuted">スコア / グレード / AIコメント</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-line bg-base px-4 py-3 text-sm">
              <div className="text-xs text-inkMuted">グレード</div>
              <div className="text-xl font-semibold">{result.grade}</div>
            </div>
            <div className="rounded-2xl border border-line bg-base px-4 py-3 text-sm">
              <div className="text-xs text-inkMuted">スコア</div>
              <div className="text-xl font-semibold">{result.score}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-base px-4 py-4">
            <div className="text-sm font-medium">AIコメント</div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-ink">{result.aiComment}</pre>
          </div>

            {result.highlights?.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">注目ポイント</div>
                {result.highlights.map((h, idx) => (
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>格付けを実行しますか？</DialogTitle>
              <DialogDescription>
                ファイルをアップロードして格付けします。既存のファイルIDがある場合はそれを優先します。
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
            <Button type="button" onClick={() => { setConfirmOpen(false); if (fileId) finalizeWithId(fileId); else onUploadAndFinalize(); }} disabled={busy}>
              {busy ? "処理中…" : "実行"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ErrorDetailsDialog open={errOpen} onOpenChange={setErrOpen} details={errText} />
    </div>
  );
}
