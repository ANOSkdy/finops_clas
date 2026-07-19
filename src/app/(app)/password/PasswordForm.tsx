"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError, apiFetch } from "@/lib/api/client";

export function PasswordForm() {
  const [currentPassword, setCurrent] = useState(""); const [newPassword, setNew] = useState(""); const [confirmPassword, setConfirm] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); setMessage(""); if (newPassword !== confirmPassword) { setError("確認用パスワードが一致しません"); setBusy(false); return; } try { await apiFetch<void>("/api/account/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) }); setCurrent(""); setNew(""); setConfirm(""); setMessage("パスワードを変更し、他の端末からログアウトしました。"); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "変更できませんでした"); } finally { setBusy(false); } }
  return <div className="page"><PageHeader title="パスワード変更" description="8文字以上で、現在と異なるパスワードを設定します。" /><form className="form-section form-stack" onSubmit={submit}>{message ? <div className="alert alert-success" role="status">{message}</div> : null}{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<TextField label="現在のパスワード" type="password" autoComplete="current-password" requiredLabel value={currentPassword} onChange={(event) => setCurrent(event.target.value)} /><TextField label="新しいパスワード" type="password" autoComplete="new-password" requiredLabel hint="8文字以上" value={newPassword} onChange={(event) => setNew(event.target.value)} /><TextField label="新しいパスワード（確認）" type="password" autoComplete="new-password" requiredLabel value={confirmPassword} onChange={(event) => setConfirm(event.target.value)} /><div className="form-actions"><Button type="submit" busy={busy} disabled={!currentPassword || newPassword.length < 8 || !confirmPassword}>パスワードを変更</Button></div></form></div>;
}
