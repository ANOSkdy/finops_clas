"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast";

type UserRow = {
  id: string;
  loginId: string;
  name: string;
  role: "admin" | "user" | "global";
  updatedAt: string;
};

type FormState = {
  loginId: string;
  name: string;
  password: string;
  role: "admin" | "user" | "global";
};

const emptyForm: FormState = {
  loginId: "",
  name: "",
  password: "",
  role: "user",
};

export default function AccountPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busyCreate, setBusyCreate] = useState(false);
  const [busyDelete, setBusyDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [authState, setAuthState] = useState<"checking" | "authorized" | "unauthorized">("checking");

  const isCreateDisabled = useMemo(() => {
    return (
      busyCreate ||
      !form.loginId.trim() ||
      !form.name.trim() ||
      !form.password ||
      form.password.length < 8
    );
  }, [busyCreate, form]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

        if (res.status === 401) {
          router.replace("/login?next=/account");
          return;
        }

        if (!res.ok) throw new Error("failed");

        const data = (await res.json()) as { role: "admin" | "user" | "global" };
        if (data.role !== "global") {
          if (!cancelled) {
            setAuthState("unauthorized");
            toast({ variant: "error", description: "権限がありません" });
          }
          router.replace("/home");
          return;
        }

        if (!cancelled) setAuthState("authorized");
      } catch {
        if (!cancelled) {
          setAuthState("unauthorized");
          toast({ variant: "error", description: "権限確認に失敗しました" });
        }
        router.replace("/home");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  useEffect(() => {
    if (authState !== "authorized") return;
    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/list", { credentials: "include" });
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as UserRow[];
        if (!cancelled) setUsers(data);
      } catch {
        if (!cancelled) toast({ variant: "error", description: "ユーザー一覧の取得に失敗しました" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authState, toast]);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function createUser() {
    if (authState !== "authorized") return;
    if (isCreateDisabled) return;
    setBusyCreate(true);
    setErrors({});
    try {
      const res = await fetch("/api/account/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (res.status === 201) {
        const created = (await res.json()) as UserRow;
        setUsers((prev) => (prev ? [created, ...prev] : [created]));
        setForm(emptyForm);
        toast({ variant: "success", description: "ユーザーを作成しました" });
        return;
      }

      if (res.status === 400) {
        const json = await res.json();
        const nextErrors: Partial<Record<keyof FormState, string>> = {};
        for (const d of json.details ?? []) {
          if (d.field === "loginId") nextErrors.loginId = "ログインIDを入力してください";
          if (d.field === "password") nextErrors.password = "パスワードを入力してください";
          if (d.field === "name") nextErrors.name = "氏名を入力してください";
        }
        setErrors(nextErrors);
        toast({ variant: "error", description: "入力内容を確認してください" });
        return;
      }

      if (res.status === 409) {
        setErrors({ loginId: "このログインIDはすでに使われています" });
        toast({ variant: "error", description: "ログインIDが重複しています" });
        return;
      }

      toast({ variant: "error", description: "作成に失敗しました" });
    } catch {
      toast({ variant: "error", description: "ネットワークエラーが発生しました" });
    } finally {
      setBusyCreate(false);
    }
  }

  async function deleteUser(userId: string) {
    if (authState !== "authorized") return;
    setBusyDelete(userId);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      if (res.status === 204) {
        setUsers((prev) => prev?.filter((u) => u.id !== userId) ?? null);
        toast({ variant: "success", description: "ユーザーを削除しました" });
        return;
      }

      if (res.status === 409) {
        const json = await res.json();
        const uploads = (json.details as Array<{ field: string; reason: string }> | undefined)?.find(
          (d) => d.field === "uploads"
        )?.reason;
        const emails = (json.details as Array<{ field: string; reason: string }> | undefined)?.find(
          (d) => d.field === "emails"
        )?.reason;
        toast({
          variant: "error",
          description: uploads || emails ? `関連データが残っています（${[uploads, emails].filter(Boolean).join(", ")}）` : "関連データが残っているため削除できません",
        });
        return;
      }

      toast({ variant: "error", description: "削除に失敗しました" });
    } catch {
      toast({ variant: "error", description: "ネットワークエラーが発生しました" });
    } finally {
      setBusyDelete(null);
    }
  }

  if (authState === "checking") {
    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold tracking-tight">アカウント管理</div>
        <div className="text-sm text-inkMuted">権限を確認しています…</div>
      </div>
    );
  }

  if (authState === "unauthorized") {
    return (
      <div className="space-y-2">
        <div className="text-xl font-semibold tracking-tight">アカウント管理</div>
        <div className="text-sm text-inkMuted">権限がありません。</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">アカウント管理</div>
        <div className="mt-1 text-sm text-inkMuted">新規ユーザーの作成と削除を行います（管理者のみ）。</div>
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">新規ユーザー作成</div>
          <div className="mt-1 text-sm text-inkMuted">パスワードはサーバー側でハッシュ化されます。</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="ログインID"
            required
            value={form.loginId}
            onChange={(e) => handleChange("loginId", e.target.value)}
            error={errors.loginId || null}
            autoComplete="username"
          />
          <Field
            label="氏名"
            required
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name || null}
          />
          <Field
            label="パスワード"
            required
            type="password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password || (form.password && form.password.length < 8 ? "8文字以上で入力してください" : null)}
            autoComplete="new-password"
          />
          <SelectField
            label="ロール"
            required
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value as FormState["role"])}
          >
            <option value="user">一般ユーザー</option>
            <option value="admin">管理者</option>
            <option value="global">グローバル管理者</option>
          </SelectField>

          <div className="flex justify-end">
            <Button onClick={createUser} disabled={isCreateDisabled} className="w-full sm:w-auto">
              {busyCreate ? "作成中…" : "作成する"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">ユーザー一覧</div>
          <div className="mt-1 text-sm text-inkMuted">削除前に関連データが無いかご確認ください。</div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          )}

          {!loading && users?.length === 0 && (
            <div className="text-sm text-inkMuted">ユーザーが見つかりません。</div>
          )}

          {!loading && users && users.length > 0 && (
            <div className="divide-y divide-line rounded-2xl border border-line bg-panel">
              {users.map((u) => (
                <div key={u.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-ink">{u.name}</div>
                    <div className="text-xs text-inkMuted">ID: {u.loginId}</div>
                    <div className="text-xs text-inkMuted">ロール: {u.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-inkMuted">更新: {new Date(u.updatedAt).toLocaleString()}</div>
                    <Button
                      variant="secondary"
                      onClick={() => deleteUser(u.id)}
                      disabled={busyDelete === u.id}
                    >
                      {busyDelete === u.id ? "削除中…" : "削除"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
