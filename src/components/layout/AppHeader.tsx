"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type ActiveCompany =
  | { company: { companyId: string; name: string } }
  | { error?: unknown };

export function AppHeader() {
  const [companyName, setCompanyName] = useState<string>("未選択");
  const [loaded, setLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = window.scrollY > 12;
        setScrolled((prev) => (prev === next ? prev : next));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className="sticky top-0 z-40 border-b border-line bg-base/90 backdrop-blur-xl transition-all"
    >
      <div className="mx-auto w-full max-w-5xl px-4 safe-x sm:px-6">
        <div
          data-scrolled={scrolled}
          className="flex h-16 items-center justify-between transition-[height] data-[scrolled=true]:h-12"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--plum-700)] text-base text-white shadow-softSm">
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

        <div
          data-scrolled={scrolled}
          className="overflow-hidden pb-3 transition-all duration-200 data-[scrolled=true]:max-h-0 data-[scrolled=true]:pb-0 data-[scrolled=true]:opacity-0"
        >
          <div className="surface-card rounded-lg px-3 py-2 text-xs text-ink md:inline-flex md:items-center md:gap-2 md:opacity-80">
            <span className="font-semibold">今日の重点</span>
            <span className="text-inkMuted">期限が近いタスクを確認</span>
          </div>
        </div>
      </div>
    </header>
  );
}
