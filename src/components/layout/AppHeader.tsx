"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type ActiveCompany =
  | { company: { companyId: string; name: string } }
  | { error?: unknown };

export function AppHeader() {
  const [companyName, setCompanyName] = useState<string>("未選択");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/customer", { credentials: "include" });
        if (!res.ok) {
          setCompanyName("未選択");
          setLoaded(true);
          return;
        }
        const data = (await res.json()) as ActiveCompany;
        // @ts-expect-error
        const name = data?.company?.name;
        setCompanyName(name || "未選択");
        setLoaded(true);
      } catch {
        setCompanyName("未選択");
        setLoaded(true);
      }
    })();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between px-4 safe-x">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-softSm">
            C
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-ink">CLAS</div>
            <div className="text-xs text-inkMuted">
              {loaded ? companyName : "読み込み中…"}
            </div>
          </div>
        </div>

        <a href="/selectcompany">
          <Button variant="secondary" size="md">
            会社切替
          </Button>
        </a>
      </div>
    </header>
  );
}