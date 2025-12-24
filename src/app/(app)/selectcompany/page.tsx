"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/toast";

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
      const data = (await res.json()) as CompanyCard[];
      setItems(data);
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

      if (res.status === 401) {
        toast({ variant: "error", description: "ログインが必要です" });
        return;
      }
      if (!res.ok) {
        toast({ variant: "error", description: "会社の選択に失敗しました" });
        return;
      }

      toast({ variant: "success", description: "会社を切り替えました" });
      window.location.href = "/home";
    } catch {
      toast({ variant: "error", description: "会社の選択に失敗しました" });
    } finally {
      setBusyId(null);
    }
  }

  const skeleton = (
    <div aria-busy="true" className="space-y-3">
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">会社を選択</div>
        <div className="mt-1 text-sm text-inkMuted">所属会社を選択してアクティブに設定します。</div>
      </div>

      <div className="flex gap-3">
        {role === "global" && (
          <a href="/newcompany"><Button>新しい会社を登録</Button></a>
        )}
        <Button variant="secondary" onClick={load}>更新</Button>
      </div>

      {state === "loading" && skeleton}

      {state === "needsLogin" && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">ログインが必要です</div>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
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
          <CardContent className="flex items-center gap-3">
            <Button onClick={load}>再試行</Button>
          </CardContent>
        </Card>
      )}

      {state === "ok" && items && items.length === 0 && (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">会社がありません</div>
            <div className="mt-1 text-sm text-inkMuted">「新しい会社を登録」から作成してください。</div>
          </CardHeader>
        </Card>
      )}

      {state === "ok" && items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.companyId} className="glass">
              <CardHeader className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">{c.name}</div>
                  <div className="mt-1 text-xs text-inkMuted">
                    {c.legalForm === "sole" ? "個人事業主" : "法人"}
                    {c.representativeName ? ` / 代表: ${c.representativeName}` : ""}
                  </div>
                  <div className="mt-2 text-xs text-inkMuted">
                    {c.contactEmail ?? ""}
                    {c.contactEmail && c.contactPhone ? " / " : ""}
                    {c.contactPhone ?? ""}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  disabled={!!busyId}
                  onClick={() => onSelect(c.companyId)}
                >
                  {busyId === c.companyId ? "切替中…" : "選択"}
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
