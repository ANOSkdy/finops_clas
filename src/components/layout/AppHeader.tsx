"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MainContainer } from "@/components/ui/MainContainer";

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
        const name = "company" in data ? data.company?.name : undefined;
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
      className="sticky top-0 z-40 border-b border-[var(--color-border-default)] bg-[color-mix(in_srgb,var(--color-surface-normal)_95%,transparent)] backdrop-blur transition-all"
    >
      <MainContainer className="safe-x">
        <div
          data-scrolled={scrolled}
          className="flex h-14 items-center justify-between transition-[height] data-[scrolled=true]:h-12"
        >
          <div className="leading-tight">
            <div className="text-base font-semibold text-[var(--color-text-primary)]">CLAS FinOps</div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {loaded ? companyName : "読み込み中…"}
            </div>
          </div>

          <a href="/selectcompany" className="mr-2">
            <Button variant="outline" size="md">
              会社切替
            </Button>
          </a>
        </div>
      </MainContainer>
    </header>
  );
}
