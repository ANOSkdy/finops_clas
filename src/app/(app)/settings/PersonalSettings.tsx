"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiFetch } from "@/lib/api/client";

export function PersonalSettings() {
  const router = useRouter(); const [logoutOpen, setLogoutOpen] = useState(false); const [busy, setBusy] = useState(false);
  function theme(value: "dark" | "light" | "system") { const resolved = value === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : value; document.documentElement.dataset.theme = resolved; if (value === "system") localStorage.removeItem("clas-theme"); else localStorage.setItem("clas-theme", value); }
  async function logout() { setBusy(true); try { await apiFetch<void>("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); } finally { setBusy(false); } }
  return <div className="page"><PageHeader title="個人設定" description="テーマとアカウントのセキュリティを管理します。" /><section className="form-section"><h2>テーマ</h2><p className="muted">表示テーマはこのブラウザに保存されます。</p><div className="form-actions form-actions-start"><Button variant="secondary" onClick={() => theme("system")}>システム</Button><Button variant="secondary" onClick={() => theme("dark")}>ダーク</Button><Button variant="secondary" onClick={() => theme("light")}>ライト</Button></div></section><section className="form-section"><h2>アカウントセキュリティ</h2><p className="muted">パスワードを変更すると、この端末以外のセッションを終了します。</p><Link className="button-link" href="/password">パスワードを変更</Link></section><section className="form-section"><h2>会社</h2><div className="form-actions form-actions-start"><Link className="button-link" href="/company_edit">会社設定</Link><Link className="button-link" href="/selectcompany">会社を切り替え</Link></div></section><section className="form-section"><h2>ログアウト</h2><Button variant="outline" onClick={() => setLogoutOpen(true)}>ログアウト</Button></section><ConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} title="ログアウト" description="現在のセッションを終了してログイン画面へ戻ります。" actions={<><Button variant="secondary" onClick={() => setLogoutOpen(false)}>キャンセル</Button><Button busy={busy} onClick={logout}>ログアウトする</Button></>} /></div>;
}
