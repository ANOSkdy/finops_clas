"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, TextareaField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { buildBlobPath } from "@/lib/uploads/path";

type ActiveCompanyResponse =
  | { company: { companyId: string; name: string } }
  | { error?: unknown };

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

export default function TrialBalancePage() {
  const { toast } = useToast();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [needsCompany, setNeedsCompany] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string>("");

  const [showMail, setShowMail] = useState(true);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("試算表送付の件");
  const [body, setBody] = useState(
`いつもお世話になっております。

試算表をお送りします。ご確認のほどよろしくお願いいたします。

――
CLAS`
  );

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

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
    () => ".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    []
  );

  async function doUpload() {
    if (!companyId) { setNeedsCompany(true); return; }
    if (!file) {
      setInlineError("ファイルを選択してください。");
      toast({ variant: "error", description: "ファイルを選択してください" });
      return;
    }

    setBusy(true);
    setInlineError(null);

    try {
      setProgress("ハッシュ計算中…（小さなファイルのみ）");
      const hash = await sha256Hex(file);

      setProgress("アップロード中…");
      const pathname = buildBlobPath({
        companyId,
        purpose: "trial_balance",
        originalFilename: file.name,
      });

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/uploads/token",
        clientPayload: JSON.stringify({ purpose: "trial_balance", originalFilename: file.name }),
      });

      setProgress("完了処理中…（DB記録）");
      const completeRes = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          purpose: "trial_balance",
          originalFilename: file.name,
          sha256: hash,
          blob: {
            url: blob.url,
            pathname: (blob as any).pathname,
            contentType: (blob as any).contentType,
            size: file.size,
          },
        }),
      });

      if (!completeRes.ok) throw new Error("complete_failed");
      const j = (await completeRes.json()) as { fileId: string };

      setFileId(j.fileId);
      setProgress(null);
      toast({ variant: "success", title: "アップロード完了", description: `ファイルID: ${j.fileId}` });
    } catch {
      setProgress(null);
      setInlineError("アップロードに失敗しました（Blob token/ログイン/会社選択を確認してください）。");
      toast({ variant: "error", title: "アップロード失敗", description: "Blob token / ログイン / 会社選択を確認してください" });
    } finally {
      setBusy(false);
    }
  }

  function openConfirm() {
    if (!fileId) {
      setInlineError("先に試算表をアップロードしてください（ファイルIDが必要です）。");
      toast({ variant: "error", description: "先にアップロードしてください" });
      return;
    }
    if (!to.trim()) {
      setInlineError("送信先（宛先）を入力してください。");
      toast({ variant: "error", description: "送信先（宛先）を入力してください" });
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setInlineError("件名/本文を入力してください。");
      toast({ variant: "error", description: "件名/本文を入力してください" });
      return;
    }
    setInlineError(null);
    setConfirmOpen(true);
  }

  async function doSend() {
    setBusy(true);
    setInlineError(null);
    setProgress("送信中…");

    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          to,
          subject,
          body,
          attachmentFileIds: [fileId],
        }),
      });

      if (res.ok) {
        const j = (await res.json()) as { status: string; providerMessageId?: string };
        toast({ variant: "success", title: "送信完了", description: j.providerMessageId ? `id: ${j.providerMessageId}` : "送信しました" });
        setProgress(null);
        setConfirmOpen(false);
        return;
      }

      // disabled(503) も想定通りなのでメッセージ分け
      if (res.status === 503) {
        toast({ variant: "error", title: "送信無効", description: "MAIL_PROVIDER=disabled です（監査ログは保存済み）" });
        setInlineError("メール送信が無効化されています（MAIL_PROVIDER=disabled）。監査ログは保存されています。");
      } else {
        toast({ variant: "error", title: "送信失敗", description: "MAIL_PROVIDER/MAIL_API_KEY/MAIL_FROM を確認してください" });
        setInlineError("送信に失敗しました（MAIL_PROVIDER/MAIL_API_KEY/MAIL_FROM を確認してください）。");
      }
    } catch {
      toast({ variant: "error", title: "送信失敗", description: "ネットワークを確認してください" });
      setInlineError("送信に失敗しました（ネットワーク）。");
    } finally {
      setProgress(null);
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">試算表</div>
        <div className="mt-1 text-sm text-inkMuted">
          試算表アップロード → メール作成 → 送信（監査ログ保存）
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

      {inlineError && (
        <div role="alert" className="rounded-2xl border border-accent2/35 bg-accent2/10 px-4 py-3 text-sm text-ink">
          {inlineError}
        </div>
      )}

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">アップロード</div>
          <div className="mt-1 text-sm text-inkMuted">選択中: {companyName ?? "未選択"}</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            className="focus-ring tap-44 w-full rounded-xl border border-line bg-panel/90 px-3 py-2 text-sm text-ink"
            accept={accept}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
          <div className="text-xs text-inkMuted">
            {file ? `${file.name} (${formatBytes(file.size)})` : "未選択"}
          </div>

          {fileId && (
            <div className="rounded-2xl border border-secondary/40 bg-secondary/15 px-4 py-3 text-sm text-ink">
              ファイルID: {fileId}
            </div>
          )}

          {progress && (
            <div className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-ink">
              {progress}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={doUpload} disabled={busy || !file}>
              {busy ? "処理中…" : "アップロード"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setFile(null); setFileId(""); if (inputRef.current) inputRef.current.value = ""; }}
              disabled={busy}
            >
              クリア
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">メール</div>
            <div className="mt-1 text-sm text-inkMuted">送信前に確認モーダルを表示します</div>
          </div>
          <Button variant="secondary" onClick={() => setShowMail((v) => !v)}>
            {showMail ? "閉じる" : "開く"}
          </Button>
        </CardHeader>

        {showMail && (
          <CardContent className="space-y-3">
            <Field
              label="送信先（宛先）"
              required
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={busy}
            />

            <Field
              label="件名"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={busy}
            />

            <TextareaField
              label="本文"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={busy}
            />

            <div className="text-xs text-inkMuted">
              添付：{fileId ? fileId : "（未アップロード）"}
            </div>

            <Button onClick={openConfirm} disabled={busy || !fileId}>
              {busy ? "送信中…" : "送信する（確認）"}
            </Button>

            <div className="text-xs text-inkMuted">
              ※ MAIL_PROVIDER=disabled の場合は送信失敗しますが、監査ログ（emails）は保存されます。
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>送信内容の確認</DialogTitle>
              <DialogDescription>
                宛先・件名・添付を確認して送信してください。
              </DialogDescription>
          </div>
          <DialogClose asChild>
            <button className="focus-ring tap-44 rounded-xl px-2 text-sm text-inkMuted" type="button" aria-label="閉じる">✕</button>
          </DialogClose>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-2xl border border-line bg-panel p-3">
            <div className="text-xs text-inkMuted">宛先</div>
            <div className="mt-1 break-all">{to}</div>
          </div>
          <div className="rounded-2xl border border-line bg-panel p-3">
            <div className="text-xs text-inkMuted">件名</div>
            <div className="mt-1">{subject}</div>
          </div>
          <div className="rounded-2xl border border-line bg-panel p-3">
            <div className="text-xs text-inkMuted">添付</div>
            <div className="mt-1 break-all">{fileId}</div>
          </div>

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="secondary" type="button" disabled={busy}>キャンセル</Button>
              </DialogClose>
              <Button type="button" onClick={doSend} disabled={busy}>
                {busy ? "送信中…" : "送信する"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
