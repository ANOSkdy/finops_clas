"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { ApiError, apiFetch } from "@/lib/api/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await apiFetch<void>("/api/auth/login", { method: "POST", body: JSON.stringify({ loginId, password }) }); router.replace(nextPath); router.refresh(); }
    catch (caught) { setError(caught instanceof ApiError ? caught.message : "通信に失敗しました"); setPassword(""); passwordRef.current?.focus(); }
    finally { setBusy(false); }
  }
  return <form className="form-stack" onSubmit={submit} style={{ marginTop: 24 }} noValidate>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<TextField label="ログインID" name="loginId" autoComplete="username" requiredLabel value={loginId} onChange={(event) => setLoginId(event.target.value)} disabled={busy} /><TextField ref={passwordRef} label="パスワード" name="password" type="password" autoComplete="current-password" requiredLabel value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} /><Button type="submit" busy={busy} disabled={!loginId || !password}>ログイン</Button></form>;
}
