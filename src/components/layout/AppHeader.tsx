"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
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
  { href: "/accounting_checklist", label: "会計チェック" },
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
    const id = window.setTimeout(() => setDrawerOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
      <header
        data-scrolled={scrolled}
        className="sticky top-0 z-40 w-full max-w-full overflow-hidden border-b border-[var(--color-border-default)] bg-[color-mix(in_srgb,var(--color-surface-normal)_95%,transparent)] backdrop-blur transition-[background-color,box-shadow]"
      >
        <MainContainer>
          <div
            data-scrolled={scrolled}
            className="flex h-16 w-full min-w-0 max-w-full items-center gap-2 overflow-hidden transition-[height] data-[scrolled=true]:h-14"
          >
            {!isSelectCompany && (
              <DialogPrimitive.Trigger asChild>
                <button
                  type="button"
                  className="focus-ring tap-44 inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-normal)] px-2.5 text-sm font-medium text-[var(--color-text-primary)]"
                  aria-label="ナビゲーションを開く"
                  aria-expanded={drawerOpen}
                  aria-controls="app-drawer-nav"
                >
                  ☰
                </button>
              </DialogPrimitive.Trigger>
            )}

            <div className="min-w-0 flex-1 overflow-hidden leading-tight">
              <div className="truncate text-lg font-semibold leading-tight text-[var(--color-text-primary)]">
                CLAS FinOps
              </div>
              <div className="truncate text-sm text-[var(--color-text-secondary)]">
                {loaded ? companyName : "読み込み中…"}
              </div>
            </div>

            <div className="ml-2 flex shrink-0 items-center gap-1.5 sm:gap-2">
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

      {!isSelectCompany && (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="t-drawer-overlay fixed inset-0 z-50 bg-black/40" />
          <DialogPrimitive.Content
            id="app-drawer-nav"
            aria-label="アプリナビゲーション"
            className="t-drawer-content fixed left-0 top-0 z-50 h-dvh w-[min(84vw,360px)] max-w-full border-r border-[var(--color-border-default)] bg-[var(--color-surface-normal)] px-3 pb-4 pt-4 shadow-[var(--shadow-elevation-4)] focus-ring outline-none"
          >
            <div className="mb-3 flex items-center justify-start gap-2">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="focus-ring tap-44 rounded-md px-2 text-sm text-[var(--color-text-primary)]"
                  aria-label="ナビゲーションを閉じる"
                >
                  ✕
                </button>
              </DialogPrimitive.Close>
              <DialogPrimitive.Title className="text-sm font-semibold text-[var(--color-text-primary)]">
                メニュー
              </DialogPrimitive.Title>
            </div>
            <NavigationList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  );
}
