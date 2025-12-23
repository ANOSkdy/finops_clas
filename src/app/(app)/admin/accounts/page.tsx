"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/toast";

type UserRow = {
  id: string;
  loginId: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  uploadsCount: number;
  emailsCount: number;
  membershipsCount: number;
  sessionsCount: number;
};

export default function AccountAdminPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const [loginId, setLoginId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setListError("ユーザー一覧の取得に失敗しました");
        return;
      }
      const data = (await res.json()) as { users?: UserRow[] };
      setUsers(data.users ?? []);
    } catch {
      setListError("ユーザー一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const canSubmit = useMemo(
    () =>
      !creating &&
      loginId.trim().length > 0 &&
      name.trim().length > 0 &&
      password.length >= 8,
    [creating, loginId, name, password]
  );

  async function createUser() {
    if (!canSubmit) return;
    try {
      setCreating(true);
      setCreateError(null);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          loginId: loginId.trim(),
          name: name.trim(),
          password,
          role,
        }),
      });
      if (res.status === 201) {
        toast({ variant: "success", description: "ユーザーを作成しました" });
        setLoginId("");
        setName("");
        setPassword("");
        setRole("user");
        fetchUsers();
        return;
      }
      if (res.status === 409) {
        setCreateError("このログインIDは既に使用されています");
        toast({ variant: "error", description: "ログインIDが重複しています" });
        return;
      }
      setCreateError("ユーザーの作成に失敗しました");
      toast({ variant: "error", description: "ユーザーの作成に失敗しました" });
    } catch {
      setCreateError("ユーザーの作成に失敗しました");
      toast({ variant: "error", description: "ネットワークを確認してください" });
    } finally {
      setCreating(false);
    }
  }

  async function openDeleteDialog(user: UserRow) {
    setConfirmUser(user);
    setSummary(null);
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/summary`, {
        credentials: "include",
      });
      if (!res.ok) {
        toast({ variant: "error", description: "依存情報の取得に失敗しました" });
        setLoadingSummary(false);
        return;
      }
      const data = await res.json();
      setSummary(data.counts);
    } catch {
      toast({ variant: "error", description: "依存情報の取得に失敗しました" });
    } finally {
      setLoadingSummary(false);
    }
  }

  const hasBlockingDeps = (s: Summary | null) =>
    !!s && (s.uploadsCount > 0 || s.emailsCount > 0);

  async function deleteUser() {
    if (!confirmUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${confirmUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 200) {
        toast({ variant: "success", description: "ユーザーを削除しました" });
        setConfirmUser(null);
        fetchUsers();
        return;
      }
      if (res.status === 409) {
        toast({ variant: "error", description: "関連データがあるため削除できません" });
        fetchUsers();
        return;
      }
      toast({ variant: "error", description: "ユーザーの削除に失敗しました" });
    } catch {
      toast({ variant: "error", description: "ユーザーの削除に失敗しました" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold tracking-tight">アカウント管理</div>
        <div className="mt-1 text-sm text-inkMuted">
          管理者のみがアクセス可能なユーザー管理画面です。
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-base font-semibold">ユーザー一覧</div>
              <div className="text-sm text-inkMuted">login_id, name, role を確認できます</div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="ID/名前で検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
              <select
                className="focus-ring h-11 rounded-lg border border-line bg-panel px-3 text-sm text-ink"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "user")}
              >
                <option value="all">すべて</option>
                <option value="admin">adminのみ</option>
                <option value="user">userのみ</option>
              </select>
              <Button variant="secondary" onClick={fetchUsers} disabled={loading}>
                再読み込み
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-inkMuted">読み込み中…</div>
          ) : listError ? (
            <div className="text-sm text-accent2">{listError}</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-inkMuted">ユーザーがいません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-inkMuted">
                    <th className="px-2 py-2">login_id</th>
                    <th className="px-2 py-2">name</th>
                    <th className="px-2 py-2">role</th>
                    <th className="px-2 py-2">created</th>
                    <th className="px-2 py-2">updated</th>
                    <th className="px-2 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/80">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-2 py-2 font-mono text-sm">{u.loginId}</td>
                      <td className="px-2 py-2">{u.name}</td>
                      <td className="px-2 py-2">{u.role}</td>
                      <td className="px-2 py-2 text-inkMuted">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-inkMuted">
                        {new Date(u.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openDeleteDialog(u)}
                        >
                          削除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">新規ユーザー発行</div>
          <div className="text-sm text-inkMuted">パスワードは8文字以上、ログには残しません</div>
        </CardHeader>
        <CardContent className="space-y-4">
          {createError && (
            <div role="alert" className="rounded-2xl border border-accent2/35 bg-panel px-4 py-3 text-sm text-ink">
              {createError}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="ログインID"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              disabled={creating}
            />
            <Field
              label="表示名"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
            />
            <Field
              label="パスワード"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={creating}
              hint="8文字以上"
            />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-ink">ロール</div>
              <div className="flex gap-2">
                {(["user", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`focus-ring tap-44 rounded-xl border px-3 py-2 text-sm ${
                      role === r
                        ? "border-primary bg-panel text-primary shadow-softSm ring-1 ring-primary/30"
                        : "border-primary/50 bg-panel text-primary hover:bg-primary/10"
                    }`}
                    disabled={creating}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={createUser} disabled={!canSubmit} className="w-full sm:w-56">
            {creating ? "作成中…" : "ユーザーを作成"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!confirmUser} onOpenChange={(v) => !v && setConfirmUser(null)}>
        <DialogContent>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>ユーザーを削除しますか？</DialogTitle>
              <DialogDescription>
                uploads / emails が存在する場合、削除できません。依存を確認してください。
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                className="focus-ring tap-44 rounded-xl px-2 text-sm text-inkMuted"
                type="button"
                aria-label="閉じる"
              >
                ✕
              </button>
            </DialogClose>
          </div>

          {confirmUser && (
            <div className="mt-3 rounded-xl border border-line bg-panel p-3 text-sm">
              <div className="font-semibold">{confirmUser.loginId}</div>
              <div className="text-inkMuted">
                {confirmUser.name} / {confirmUser.role}
              </div>
            </div>
          )}

          {loadingSummary ? (
            <div className="mt-3 text-sm text-inkMuted">依存情報を取得中…</div>
          ) : summary ? (
            <div className="mt-3 space-y-2 text-sm">
              <div>uploads: {summary.uploadsCount} 件</div>
              <div>emails: {summary.emailsCount} 件</div>
              <div>memberships: {summary.membershipsCount} 件</div>
              <div>sessions: {summary.sessionsCount} 件</div>
              {hasBlockingDeps(summary) && (
                <div className="rounded-lg border border-accent2/40 bg-panel px-3 py-2 text-accent2">
                  uploads または emails があるため削除できません。先に移譲/削除してください。
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="secondary" type="button" disabled={deleting}>
                キャンセル
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={deleteUser}
              disabled={
                deleting || loadingSummary || !summary || hasBlockingDeps(summary)
              }
            >
              {deleting ? "削除中…" : "削除する"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
