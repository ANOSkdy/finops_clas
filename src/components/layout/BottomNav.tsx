"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

type Item = { href: string; label: string; icon: string };

const items: Item[] = [
  { href: "/home", label: "ホーム", icon: "🏠" },
  { href: "/schedule", label: "スケジュール", icon: "📅" },
  { href: "/upload", label: "アップロード", icon: "📊" },
  { href: "/manual", label: "マニュアル", icon: "📑" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isSelectCompany = pathname === "/selectcompany" || pathname.startsWith("/selectcompany/");

  if (isSelectCompany) return null;

  const itemClass = (active: boolean) =>
    cn(
      "focus-ring tap-44 col-span-1 flex flex-col items-center justify-center rounded-lg px-1 py-2 text-[10px] whitespace-nowrap",
      active ? "text-primary font-semibold" : "text-inkMuted"
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-panel/95 backdrop-blur safe-bottom">
      <div className="mx-auto grid h-16 max-w-[1080px] grid-cols-5 items-center px-2 safe-x">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <a
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={itemClass(active)}
            >
              <div className="text-lg" aria-hidden="true">
                {it.icon}
              </div>
              <div className="mt-0.5">{it.label}</div>
              <span
                aria-hidden="true"
                className={cn(
                  "nav-indicator mt-1 h-1 w-8 rounded-full transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
