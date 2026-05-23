"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MainContainer } from "@/components/ui/MainContainer";
import { cn } from "@/lib/ui/cn";

type ActiveCompany =
  | { company: { companyId: string; name: string } }
  | { error?: unknown };

type NavItem = { href: string; label: string };

const navItems: NavItem[] = [
  { href: "/home", label: "ホーム" },
  { href: "/schedule", label: "スケジュール" },
  { href: "/upload", label: "アップロード" },
  { href: "/manual", label: "マニュアル" },
  { href: "/settings", label: "設定" },
];

function NavigationList({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="アプリナビゲーション" className="space-y-1">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors",
              active
                ? "bg-[var(--color-bg-secondary)] font-semibold text-[var(--color-text-primary)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <span className="truncate">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState<string>("未選択");
  const [loaded, setLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSelectCompany = pathname === "/selectcompany" || pathname.startsWith("/selectcompany/");

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        data-scrolled={scrolled}
        className="sticky top-0 z-40 w-full max-w-full overflow-hidden border-b border-[var(--color-border-default)] bg-[color-mix(in_srgb,var(--color-surface-normal)_95%,transparent)] backdrop-blur transition-[background-color,box-shadow]"
      >
        <MainContainer className="safe-x px-3 sm:px-6">
          <div
            data-scrolled={scrolled}
            className="flex h-14 w-full min-w-0 max-w-full items-center justify-between gap-1.5 overflow-hidden transition-[height] data-[scrolled=true]:h-12 sm:gap-2"
          >
            <div className="min-w-0 flex-1 overflow-hidden leading-tight">
              <div className="truncate text-base font-semibold text-[var(--color-text-primary)]">CLAS FinOps</div>
              <div className="truncate text-xs text-[var(--color-text-secondary)]">
                {loaded ? companyName : "読み込み中…"}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {!isSelectCompany && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="focus-ring tap-44 inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-normal)] px-2.5 text-sm font-medium text-[var(--color-text-primary)]"
                  aria-label="ナビゲーションを開く"
                  aria-expanded={drawerOpen}
                  aria-controls="app-drawer-nav"
                >
                  ☰
                </button>
              )}
              <a href="/selectcompany" className="shrink-0 whitespace-nowrap">
                <Button
                  variant="outline"
                  size="md"
                  className="px-2 text-xs whitespace-nowrap sm:px-5 sm:text-sm"
                >
                  会社切替
                </Button>
              </a>
            </div>
          </div>
        </MainContainer>
      </header>

      {!isSelectCompany && drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-x-hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-label="ナビゲーションを閉じる"
          />

          <aside
            id="app-drawer-nav"
            className="t-panel-open relative z-10 h-full w-[min(84vw,360px)] max-w-full border-r border-[var(--color-border-default)] bg-[var(--color-surface-normal)] px-3 pb-4 pt-4 shadow-[var(--shadow-elevation-4)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">メニュー</p>
              <button
                type="button"
                className="focus-ring tap-44 rounded-md px-2 text-sm text-[var(--color-text-primary)]"
                onClick={() => setDrawerOpen(false)}
                aria-label="ナビゲーションを閉じる"
              >
                ✕
              </button>
            </div>
            <NavigationList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
