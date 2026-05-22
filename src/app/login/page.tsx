"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/toast";

function LoginForm() {
  const sp = useSearchParams();
  const next = useMemo(() => sp.get("next") || "/selectcompany", [sp]);
  const { toast } = useToast();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDisabled = busy || loginId.trim().length === 0 || password.trim().length === 0;

  async function onSubmit() {
    if (isDisabled) return;
    try {
      setBusy(true);
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ loginId, password }),
      });

      if (res.status !== 204) {
        setError("IDまたはパスワードが違います。");
        return;
      }

      toast({ variant: "success", description: "ログインしました" });
      window.location.href = next;
    } catch {
      setError("ログインに失敗しました。");
      toast({ variant: "error", description: "ネットワークを確認してください" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <Card className="min-h-[360px]  text-[var(--color-text-primary)]">
          <CardHeader className="px-8 pt-5">
            <div className="text-xl font-semibold tracking-tight">ログイン</div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8 pt-6">
            {error && (
              <div role="alert" className="t-error-pop rounded-2xl border border-accent2/30 bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">ログインID</div>
              <Field
                label=""
                aria-label="ログインID"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="text"
                disabled={busy}
                inputClassName="bg-[var(--color-bg-secondary)] text-black h-12"
                labelClassName="text-[var(--color-text-secondary)] peer-placeholder-shown:text-[var(--color-text-secondary)] peer-focus:text-[var(--color-text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">パスワード</div>
              <Field
                label=""
                aria-label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmit();
                }}
                inputClassName="bg-[var(--color-bg-secondary)] text-black h-12"
                labelClassName="text-[var(--color-text-secondary)] peer-placeholder-shown:text-[var(--color-text-secondary)] peer-focus:text-[var(--color-text-primary)]"
              />
            </div>

            <Button onClick={onSubmit} disabled={isDisabled} className="w-full">
              {busy ? "ログイン中…" : "ログイン"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-3xl">
            <Card className="min-h-[360px]  text-[var(--color-text-primary)]">
              <CardHeader className="px-8 pt-5">
                <div className="text-xl font-semibold tracking-tight">ログイン</div>
                <div className="mt-1 text-sm text-[var(--color-text-secondary)]">読み込み中…</div>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8 pt-6">
                <div className="h-12 rounded-2xl border border-[var(--color-border-default)]/60 bg-[var(--color-bg-secondary)]/80" />
                <div className="h-12 rounded-2xl border border-[var(--color-border-default)]/60 bg-[var(--color-bg-secondary)]/80" />
                <div className="h-12 rounded-2xl border border-[var(--color-border-default)]/60 bg-[var(--color-bg-secondary)]/80" />
              </CardContent>
            </Card>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
