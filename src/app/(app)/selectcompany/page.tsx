"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type CompanyCard = {
  companyId: string;
  name: string;
  representativeName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  legalForm: "corporation" | "sole";
};

type Role = "admin" | "user" | "global";

export default function SelectCompanyPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CompanyCard[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "needsLogin" | "error">("loading");
  const [role, setRole] = useState<Role | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setItems(null);
    try {
      const authRes = await fetch("/api/auth/me", { credentials: "include" });
      if (authRes.status === 401) { setState("needsLogin"); setItems([]); setRole(null); return; }
      if (!authRes.ok) { setState("error"); setItems([]); setRole(null); return; }
      const auth = (await authRes.json()) as { role: Role };
      setRole(auth.role);

      const res = await fetch("/api/customer/list", { credentials: "include" });
      if (res.status === 401) { setState("needsLogin"); setItems([]); setRole(null); return; }
      if (!res.ok) { setState("error"); setItems([]); return; }
      setItems((await res.json()) as CompanyCard[]);
      setState("ok");
    } catch {
      setState("error");
      setItems([]);
      setRole(null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onSelect(companyId: string) {
    try {
      setBusyId(companyId);
      const res = await fetch("/api/customer/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyId }),
      });
      if (res.status === 401) { toast({ variant: "error", description: "ログインが必要です" }); return; }
      if (!res.ok) { toast({ variant: "error", description: "会社の選択に失敗しました" }); return; }
      toast({ variant: "success", description: "会社を切り替えました" });
      window.location.href = "/home";
    } catch {
      toast({ variant: "error", description: "会社の選択に失敗しました" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="会社を選択"
        description="所属会社を選択してアクティブに設定します。"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load}>更新</Button>
            {role === "global" || role === "admin" ? <a href="/newcompany"><Button>新規登録</Button></a> : null}
          </div>
        }
      />

      {state === "loading" && (
        <div aria-busy="true" className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {state === "needsLogin" && (
        <Card className="glass">
          <CardHeader><div className="text-base font-semibold">ログインが必要です</div></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href="/login"><Button>ログインへ</Button></a>
            <Button variant="secondary" onClick={load}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "error" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">読み込みに失敗しました</div>
            <div className="mt-1 text-sm text-inkMuted">ネットワークを確認してください。</div>
          </CardHeader>
          <CardContent><Button onClick={load}>再試行</Button></CardContent>
        </Card>
      )}

      {state === "ok" && items && items.length === 0 && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">会社がありません</div>
            <div className="mt-1 text-sm text-inkMuted">新しい会社を登録してください。</div>
          </CardHeader>
          <CardContent><a href="/newcompany"><Button>新しい会社を登録</Button></a></CardContent>
        </Card>
      )}

      {state === "ok" && items && items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <Card key={c.companyId} className="glass">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold leading-6 text-ink">{c.name}</div>
                    <div className="mt-2"><StatusBadge tone="primary">{c.legalForm === "sole" ? "個人事業主" : "法人"}</StatusBadge></div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs leading-5 text-inkMuted">
                  {c.representativeName ? <div>代表: {c.representativeName}</div> : null}
                  {c.contactEmail ? <div className="break-all">{c.contactEmail}</div> : null}
                  {c.contactPhone ? <div>{c.contactPhone}</div> : null}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Button className="w-full" disabled={!!busyId} onClick={() => onSelect(c.companyId)}>
                  {busyId === c.companyId ? "切替中…" : "選択"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
