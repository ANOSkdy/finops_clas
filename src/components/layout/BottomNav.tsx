"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";
import { MainContainer } from "@/components/ui/MainContainer";

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
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isSelectCompany = pathname === "/selectcompany" || pathname.startsWith("/selectcompany/");

  if (isSelectCompany) return null;

  const itemClass = (active: boolean) =>
    cn(
      "focus-ring tap-44 col-span-1 flex items-center justify-center rounded-lg px-1 py-2 text-[11px] whitespace-nowrap",
      active
        ? "font-semibold text-[var(--color-text-primary)]"
        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border-default)] bg-[color-mix(in_srgb,var(--color-surface-normal)_95%,transparent)] backdrop-blur safe-bottom">
      <MainContainer className="safe-x">
        <div className="grid h-16 grid-cols-5 items-center px-2">
          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <a
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={itemClass(active)}
              >
                <div>{it.label}</div>
                <span
                  aria-hidden="true"
                  className={cn(
                    "nav-indicator mt-1 ml-1 h-1 w-6 rounded-full transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
              </a>
            );
          })}
        </div>
      </MainContainer>
    </nav>
  );
}

export default BottomNav;
