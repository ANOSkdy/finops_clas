"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
      } catch {
        // noop
      }
    })();
    return () => {
      cancelled = true;
    };
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
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">設定</div>
        <div className="mt-1 text-sm text-inkMuted">アカウントとセキュリティ</div>
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">アカウント</div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href="/password">
              <Button className="w-48" variant="secondary">
                パスワード
              </Button>
            </a>
            <Button className="w-48" onClick={() => setOpen(true)} disabled={busy}>
              ログアウト
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">会社情報</div>
          <div className="mt-1 text-sm text-inkMuted">登録済みの会社情報を修正します</div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <a href="/company_edit">
            <Button className="w-48">会社情報を修正</Button>
          </a>
        </CardContent>
      </Card>

      {role === "global" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">システム管理</div>
            <div className="mt-1 text-sm text-inkMuted">グローバル権限者向けの設定を表示します</div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <a href="/system_manager">
              <Button className="w-48">システム管理</Button>
            </a>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>ログアウトしますか？</DialogTitle>
              <DialogDescription>セッションCookieを破棄してログイン画面へ戻ります。</DialogDescription>
            </div>
            <DialogClose asChild>
              <button className="focus-ring tap-44 rounded-xl px-2 text-sm text-inkMuted" type="button" aria-label="閉じる">✕</button>
            </DialogClose>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="secondary" type="button" disabled={busy}>キャンセル</Button>
            </DialogClose>
            <Button type="button" onClick={logout} disabled={busy}>
              {busy ? "処理中…" : "ログアウト"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
