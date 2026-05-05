"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

type Item = { href: string; label: string; icon: string };

const items: Item[] = [
  { href: "/home", label: "ホーム", icon: "🏠" },
  { href: "/schedule", label: "予定", icon: "📅" },
  { href: "/upload", label: "アップ", icon: "📊" },
  { href: "/manual", label: "手引き", icon: "📑" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isSelectCompany = pathname === "/selectcompany" || pathname.startsWith("/selectcompany/");

  if (isSelectCompany) return null;

  const itemClass = (active: boolean) =>
    cn(
      "focus-ring tap-44 col-span-1 flex min-w-0 flex-col items-center justify-center rounded-lg px-0.5 py-2 text-[10px] whitespace-nowrap sm:px-1",
      active ? "text-primary font-semibold" : "text-inkMuted"
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-panel/95 backdrop-blur safe-bottom">
      <div className="mx-auto grid h-16 max-w-[1080px] grid-cols-5 items-center px-1 safe-x sm:px-2">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={itemClass(active)}
            >
              <div className="text-lg leading-none" aria-hidden="true">
                {it.icon}
              </div>
              <div className="mt-1 max-w-full overflow-hidden text-ellipsis">{it.label}</div>
              <span
                aria-hidden="true"
                className={cn(
                  "nav-indicator mt-1 h-1 w-7 rounded-full transition-opacity sm:w-8",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
