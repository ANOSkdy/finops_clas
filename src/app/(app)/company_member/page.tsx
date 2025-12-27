"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast";

type Role = "admin" | "user" | "global";
type RoleInCompany = "owner" | "admin" | "member" | "accountant";

type CompanyOption = {
  id: string;
  name: string;
  legalForm: "corporation" | "sole";
};

type UserOption = {
  id: string;
  name: string;
  loginId: string;
  role: Role;
};

type MembershipRow = {
  companyId: string;
  companyName: string;
  legalForm: "corporation" | "sole";
  userId: string;
  userName: string;
  loginId: string;
  userRole: Role;
  roleInCompany: RoleInCompany;
  createdAt: string;
};

type FormState = {
  companyId: string;
  userId: string;
  roleInCompany: RoleInCompany;
};

const emptyForm: FormState = {
  companyId: "",
  userId: "",
  roleInCompany: "member",
};

export default function CompanyMemberPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<CompanyOption[] | null>(null);
  const [users, setUsers] = useState<UserOption[] | null>(null);
  const [memberships, setMemberships] = useState<MembershipRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isSubmitDisabled = useMemo(() => {
    return (
      busy ||
      !form.companyId ||
      !form.userId ||
      !form.roleInCompany
    );
  }, [busy, form.companyId, form.roleInCompany, form.userId]);

  const legalFormLabel = (legalForm: "corporation" | "sole") =>
    legalForm === "corporation" ? "法人" : "個人事業主";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/company_member", { credentials: "include" });
      if (res.status === 401) {
        router.replace("/login?next=/company_member");
        setLoading(false);
        return;
      }
      if (res.status === 403) {
        toast({ variant: "error", description: "権限がありません" });
        router.replace("/home");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("failed");

      const data = (await res.json()) as {
        companies: CompanyOption[];
        users: UserOption[];
        memberships: MembershipRow[];
      };
      setCompanies(data.companies);
      setUsers(data.users);
      setMemberships(data.memberships);
    } catch {
      setError("読み込みに失敗しました。ネットワークをご確認ください。");
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit() {
    if (isSubmitDisabled) return;
    setBusy(true);
    setFieldErrors({});
    try {
      const res = await fetch("/api/company_member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (res.status === 201) {
        const created = (await res.json()) as MembershipRow;
        setMemberships((prev) => (prev ? [created, ...prev] : [created]));
        setForm(emptyForm);
        toast({ variant: "success", description: "紐付けを登録しました" });
        return;
      }

      if (res.status === 400) {
        const json = await res.json();
        const nextErrors: Partial<Record<keyof FormState, string>> = {};
        for (const d of json.details ?? []) {
          if (d.field === "companyId") nextErrors.companyId = "会社を選択してください";
          if (d.field === "userId") nextErrors.userId = "ユーザーを選択してください";
          if (d.field === "roleInCompany") nextErrors.roleInCompany = "会社内ロールを選択してください";
        }
        setFieldErrors(nextErrors);
        toast({ variant: "error", description: "入力内容を確認してください" });
        return;
      }

      if (res.status === 404) {
        const json = await res.json();
        const notFoundField = json.details?.find((d: { field: string }) => d.field === "companyId" || d.field === "userId")?.field;
        if (notFoundField === "companyId") setFieldErrors({ companyId: "会社が見つかりません" });
        if (notFoundField === "userId") setFieldErrors({ userId: "ユーザーが見つかりません" });
        toast({ variant: "error", description: "選択したデータが見つかりません" });
        return;
      }

      if (res.status === 409) {
        setFieldErrors({
          companyId: "既に紐付け済みです",
          userId: "既に紐付け済みです",
        });
        toast({ variant: "error", description: "この組み合わせは既に登録済みです" });
        return;
      }

      if (res.status === 401) {
        router.replace("/login?next=/company_member");
        return;
      }

      toast({ variant: "error", description: "紐付けの登録に失敗しました" });
    } catch {
      toast({ variant: "error", description: "ネットワークエラーが発生しました" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">会社メンバー紐付け</div>
        <div className="mt-1 text-sm text-inkMuted">
          登録済みの法人・個人事業主にユーザーを紐付けてメンバーとして登録します。
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-accent2/35 bg-panel px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? "読み込み中…" : "再読込"}
        </Button>
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">メンバーを追加</div>
          <div className="mt-1 text-sm text-inkMuted">
            会社とユーザーを選び、会社内ロールを設定して紐付けます。
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField
            label="会社"
            required
            value={form.companyId}
            onChange={(e) => handleChange("companyId", e.target.value)}
            disabled={loading || busy || (companies?.length ?? 0) === 0}
            placeholder={loading ? "読み込み中..." : "選択してください"}
            error={fieldErrors.companyId || null}
            hint={
              !loading && (companies?.length ?? 0) === 0
                ? "会社が登録されていません。先に会社を作成してください。"
                : undefined
            }
          >
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}（{legalFormLabel(c.legalForm)}）
              </option>
            ))}
          </SelectField>

          <SelectField
            label="ユーザー"
            required
            value={form.userId}
            onChange={(e) => handleChange("userId", e.target.value)}
            disabled={loading || busy || (users?.length ?? 0) === 0}
            placeholder={loading ? "読み込み中..." : "選択してください"}
            error={fieldErrors.userId || null}
            hint={
              !loading && (users?.length ?? 0) === 0
                ? "ユーザーが登録されていません。先にアカウントを作成してください。"
                : undefined
            }
          >
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}（ID: {u.loginId} / ロール: {u.role}）
              </option>
            ))}
          </SelectField>

          <SelectField
            label="会社内ロール"
            required
            value={form.roleInCompany}
            onChange={(e) => handleChange("roleInCompany", e.target.value as FormState["roleInCompany"])}
            disabled={busy}
            error={fieldErrors.roleInCompany || null}
          >
            <option value="owner">オーナー</option>
            <option value="admin">管理者</option>
            <option value="member">メンバー</option>
            <option value="accountant">会計担当</option>
          </SelectField>

          <div className="flex justify-end">
            <Button onClick={onSubmit} disabled={isSubmitDisabled} className="w-full sm:w-auto">
              {busy ? "登録中…" : "紐付けを登録"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">紐付け一覧</div>
          <div className="mt-1 text-sm text-inkMuted">登録済みのメンバーを確認できます。</div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          )}

          {!loading && memberships?.length === 0 && (
            <div className="text-sm text-inkMuted">紐付けがまだ登録されていません。</div>
          )}

          {!loading && memberships && memberships.length > 0 && (
            <div className="divide-y divide-line rounded-2xl border border-line bg-panel">
              {memberships.map((m) => (
                <div key={`${m.companyId}-${m.userId}`} className="grid gap-2 px-4 py-3 sm:grid-cols-3 sm:items-center">
                  <div>
                    <div className="text-sm font-semibold text-ink">{m.companyName}</div>
                    <div className="text-xs text-inkMuted">{legalFormLabel(m.legalForm)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{m.userName}</div>
                    <div className="text-xs text-inkMuted">ID: {m.loginId} / ユーザーロール: {m.userRole}</div>
                  </div>
                  <div className="text-xs text-inkMuted sm:text-right">
                    <div>会社内ロール: {m.roleInCompany}</div>
                    <div>登録日: {new Date(m.createdAt).toLocaleString()}</div>
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
