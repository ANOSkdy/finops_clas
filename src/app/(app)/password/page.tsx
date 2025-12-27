"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/toast";

type FormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function PasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [authState, setAuthState] = useState<"checking" | "ready" | "unauthorized">("checking");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login?next=/password");
          if (!cancelled) setAuthState("unauthorized");
          return;
        }
        if (!res.ok) throw new Error("failed");
        if (!cancelled) setAuthState("ready");
      } catch {
        if (!cancelled) {
          setAuthState("unauthorized");
          toast({ variant: "error", description: "権限の確認に失敗しました" });
        }
        router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  const isDisabled = useMemo(() => {
    if (busy) return true;
    if (!form.currentPassword.trim()) return true;
    if (!form.newPassword.trim()) return true;
    if (form.newPassword.length < 8) return true;
    if (form.newPassword !== form.confirmPassword) return true;
    return false;
  }, [busy, form.confirmPassword, form.currentPassword, form.newPassword]);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function changePassword() {
    if (authState !== "ready") return;
    if (isDisabled) return;
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      if (res.status === 204) {
        setForm(emptyForm);
        toast({ variant: "success", description: "パスワードを変更しました" });
        return;
      }

      if (res.status === 401) {
        toast({ variant: "error", description: "再度ログインしてください" });
        router.replace("/login?next=/password");
        return;
      }

      if (res.status === 400) {
        const json = await res.json();
        const nextErrors: FormErrors = {};
        for (const d of json.details ?? []) {
          if (d.field === "currentPassword") nextErrors.currentPassword = "現在のパスワードが違います";
          if (d.field === "newPassword" && d.reason === "too_small") nextErrors.newPassword = "8文字以上で入力してください";
          if (d.field === "newPassword" && d.reason === "same_as_current") nextErrors.newPassword = "現在のパスワードと同じものは使用できません";
        }
        if (form.newPassword !== form.confirmPassword) {
          nextErrors.confirmPassword = "新しいパスワードが一致しません";
        }
        setErrors(nextErrors);
        toast({ variant: "error", description: "入力内容を確認してください" });
        return;
      }

      toast({ variant: "error", description: "パスワードの変更に失敗しました" });
    } catch {
      toast({ variant: "error", description: "ネットワークエラーが発生しました" });
    } finally {
      setBusy(false);
    }
  }

  if (authState === "checking") {
    return (
      <div className="space-y-2">
        <div className="text-xl font-semibold tracking-tight">パスワード変更</div>
        <div className="text-sm text-inkMuted">権限を確認しています…</div>
      </div>
    );
  }

  if (authState === "unauthorized") {
    return (
      <div className="space-y-2">
        <div className="text-xl font-semibold tracking-tight">パスワード変更</div>
        <div className="text-sm text-inkMuted">このページを表示するにはログインが必要です。</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">パスワード変更</div>
        <div className="mt-1 text-sm text-inkMuted">現在のパスワードと新しいパスワードを入力してください。</div>
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">パスワードを更新</div>
          <div className="mt-1 text-sm text-inkMuted">新しいパスワードは8文字以上で設定してください。</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="現在のパスワード"
            required
            type="password"
            value={form.currentPassword}
            onChange={(e) => handleChange("currentPassword", e.target.value)}
            error={errors.currentPassword || null}
            autoComplete="current-password"
          />
          <Field
            label="新しいパスワード"
            required
            type="password"
            value={form.newPassword}
            onChange={(e) => handleChange("newPassword", e.target.value)}
            error={errors.newPassword || (form.newPassword && form.newPassword.length < 8 ? "8文字以上で入力してください" : null)}
            autoComplete="new-password"
          />
          <Field
            label="新しいパスワード（確認）"
            required
            type="password"
            value={form.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={
              errors.confirmPassword ||
              (form.confirmPassword && form.newPassword !== form.confirmPassword ? "新しいパスワードが一致しません" : null)
            }
            autoComplete="new-password"
          />

          <div className="flex justify-end">
            <Button onClick={changePassword} disabled={isDisabled} className="w-full sm:w-auto">
              {busy ? "変更中…" : "変更する"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
