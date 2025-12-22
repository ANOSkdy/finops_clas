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
    <main className="min-h-screen bg-base text-ink flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <Card className="min-h-[360px] border-transparent bg-[royalblue] text-white">
          <CardHeader className="px-8 pt-5">
            <div className="text-xl font-semibold tracking-tight">ログイン</div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8 pt-6">
            {error && (
              <div role="alert" className="rounded-2xl border border-accent2/30 bg-accent2/10 px-4 py-3 text-sm text-ink">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">ログインID</div>
            <Field
              label="ログインID"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="text"
              disabled={busy}
              inputClassName="bg-white text-black h-12"
              labelClassName="text-white/90 peer-placeholder-shown:text-white/90 peer-focus:text-white"
            />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">パスワード</div>
            <Field
              label="パスワード"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={busy}
              onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
              inputClassName="bg-white text-black h-12"
              labelClassName="text-white/90 peer-placeholder-shown:text-white/90 peer-focus:text-white"
            />
            </div>

            <Button
              onClick={onSubmit}
              disabled={isDisabled}
              className="w-full border border-white/70"
            >
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
        <main className="min-h-screen bg-base text-ink flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-3xl">
            <Card className="min-h-[360px] border-transparent bg-[royalblue] text-white">
              <CardHeader className="px-8 pt-5">
                <div className="text-xl font-semibold tracking-tight">ログイン</div>
                <div className="mt-1 text-sm text-white/80">読み込み中…</div>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8 pt-6">
                <div className="h-12 rounded-2xl border border-line/60 bg-base/80" />
                <div className="h-12 rounded-2xl border border-line/60 bg-base/80" />
                <div className="h-12 rounded-2xl border border-line/60 bg-base/80" />
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
