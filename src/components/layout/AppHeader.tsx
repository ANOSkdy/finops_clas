"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type ActiveCompany =
  | { company: { companyId: string; name: string } }
  | { error?: unknown };

const COMPANY_CACHE_KEY = "clasz_active_company_name";

export function AppHeader() {
  const [companyName, setCompanyName] = useState<string>("未選択");
  const [loaded, setLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const cached = window.localStorage.getItem(COMPANY_CACHE_KEY);
    if (cached) {
      setCompanyName(cached);
      setLoaded(true);
    }

    (async () => {
      try {
        const res = await fetch("/api/customer", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          setCompanyName("未選択");
          window.localStorage.removeItem(COMPANY_CACHE_KEY);
          setLoaded(true);
          return;
        }
        const data = (await res.json()) as ActiveCompany;
        const name = "company" in data ? data.company?.name : undefined;
        const nextName = name || "未選択";
        setCompanyName(nextName);
        if (name) window.localStorage.setItem(COMPANY_CACHE_KEY, nextName);
        else window.localStorage.removeItem(COMPANY_CACHE_KEY);
        setLoaded(true);
      } catch {
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
      className="sticky top-0 z-40 border-b border-line bg-panel/95 backdrop-blur transition-all"
    >
      <div className="mx-auto w-full max-w-[1080px] px-4 safe-x sm:px-6">
        <div
          data-scrolled={scrolled}
          className="flex h-14 items-center justify-between transition-[height] data-[scrolled=true]:h-12"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-button shadow-softSm">
              C
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-ink">CLAS</div>
              <div className="text-xs text-inkMuted">
                {loaded ? companyName : "未選択"}
              </div>
            </div>
          </div>

          <Link href="/selectcompany" prefetch className="mr-2">
            <Button variant="primary" size="md">
              会社切替
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
