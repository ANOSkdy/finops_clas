"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

type Item = { href: string; label: string };

const items: Item[] = [
  { href: "/home", label: "ホーム" },
  { href: "/schedule", label: "スケジュール" },
  { href: "/upload", label: "アップロード" },
  { href: "/manual", label: "マニュアル" },
  { href: "/settings", label: "設定" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isSelectCompany = pathname === "/selectcompany" || pathname.startsWith("/selectcompany/");

  if (isSelectCompany) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="focus-ring fixed left-3 top-[calc(var(--app-header-height)+0.75rem)] z-50 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-normal)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-elevation-1)]"
        aria-expanded={open}
        aria-controls="app-side-nav"
      >
        {open ? "ナビを閉じる" : "ナビを開く"}
      </button>

      <nav
        id="app-side-nav"
        className={cn(
          "t-panel fixed left-0 top-[var(--app-header-height)] z-40 h-[calc(100dvh-var(--app-header-height))] safe-bottom border-r border-[var(--color-border-default)] bg-[var(--color-surface-normal)]/95 px-2 pt-16 backdrop-blur",
          open ? "t-panel-open" : "t-panel-closed"
        )}
      >
        <div className="w-44 space-y-1">
          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <a
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors",
                  active
                    ? "bg-[var(--color-bg-secondary)] font-semibold text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <span className="truncate">{it.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default BottomNav;
