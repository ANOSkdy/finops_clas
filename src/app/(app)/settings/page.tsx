"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ActionCard } from "@/components/ui/ActionCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";

type Role = "admin" | "user" | "global";

export default function SettingsPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { role: Role };
        if (!cancelled) setRole(data.role);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      toast({ variant: "success", description: "ログアウトしました" });
      window.location.href = "/login";
    } catch {
      toast({ variant: "error", description: "ログアウトに失敗しました" });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="設定" description="アカウントと会社情報を管理します。" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActionCard icon="🔐" title="パスワード" description="ログインに使用するパスワードを変更します。" action={<a href="/password"><Button className="w-full">パスワード</Button></a>} />
        <ActionCard icon="🏢" title="会社情報" description="登録済みの会社情報を修正します。" action={<a href="/company_edit"><Button className="w-full">会社情報を修正</Button></a>} />
        <ActionCard icon="🚪" title="ログアウト" description="セッションを終了してログイン画面へ戻ります。" action={<Button className="w-full" variant="secondary" onClick={() => setOpen(true)} disabled={busy}>ログアウト</Button>} />
        {role === "global" && <ActionCard icon="⚙️" title="システム管理" description="グローバル権限者向けの設定を表示します。" action={<a href="/system_manager"><Button className="w-full">システム管理</Button></a>} />}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>ログアウトしますか？</DialogTitle>
              <DialogDescription>ログイン画面へ戻ります。</DialogDescription>
            </div>
            <DialogClose asChild>
              <button className="focus-ring tap-44 rounded-xl px-2 text-sm text-inkMuted" type="button" aria-label="閉じる">✕</button>
            </DialogClose>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild><Button variant="secondary" type="button" disabled={busy}>キャンセル</Button></DialogClose>
            <Button type="button" onClick={logout} disabled={busy}>{busy ? "処理中…" : "ログアウト"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
