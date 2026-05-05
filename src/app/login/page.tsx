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
        toast({ variant: "error", description: "ログインに失敗しました" });
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
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-10 text-ink">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary text-base font-semibold text-button shadow-softSm">
            C
          </div>
          <h1 className="mt-4 text-lg font-semibold leading-7 tracking-tight text-ink">CLAS FinOps</h1>
          <p className="mt-1 text-sm leading-5 text-inkMuted">
            会社を選択して、アップロードと期限管理を開始します。
          </p>
        </div>

        <Card className="surface-card text-ink">
          <CardHeader className="px-5 pt-5">
            <div className="text-base font-semibold tracking-tight">ログイン</div>
          </CardHeader>
          <CardContent className="space-y-5 px-5 pb-5 pt-4">
            {error && (
              <div role="alert" className="rounded-xl border border-accent2/35 bg-accent2/10 px-4 py-3 text-sm text-ink">
                {error}
              </div>
            )}

            <Field
              label="ログインID"
              aria-label="ログインID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="text"
              disabled={busy}
            />

            <Field
              label="パスワード"
              aria-label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />

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
        <main className="flex min-h-screen items-center justify-center bg-base px-4 py-10 text-ink">
          <div className="w-full max-w-md">
            <Card className="surface-card text-ink">
              <CardHeader className="px-5 pt-5">
                <div className="text-base font-semibold tracking-tight">ログイン</div>
                <div className="mt-1 text-sm text-inkMuted">読み込み中…</div>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5 pt-4">
                <div className="h-11 rounded-lg border border-line bg-panel" />
                <div className="h-11 rounded-lg border border-line bg-panel" />
                <div className="h-11 rounded-lg border border-line bg-primary/10" />
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
