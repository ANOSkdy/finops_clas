"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

type Item = { href: string; label: string; icon: string };

const left: Item[] = [
  { href: "/home", label: "Home", icon: "⌂" },
  { href: "/schedule", label: "Schedule", icon: "🗓" },
];

const right: Item[] = [
  { href: "/manual", label: "Manual", icon: "📘" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const itemClass = (active: boolean) =>
    cn(
      "ring-focus tap-44 col-span-1 flex flex-col items-center justify-center rounded-xl px-2 py-2 text-xs",
      active ? "text-primary" : "text-inkMuted"
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-base/95 backdrop-blur safe-bottom">
      <div className="mx-auto grid h-16 max-w-xl grid-cols-5 items-center px-2 safe-x">
        {left.map((it) => (
          <a
            key={it.href}
            href={it.href}
            aria-current={isActive(it.href) ? "page" : undefined}
            className={itemClass(isActive(it.href))}
          >
            <div className="text-lg" aria-hidden="true">{it.icon}</div>
            <div className="mt-0.5">{it.label}</div>
          </a>
        ))}

        {/* Center CTA */}
        <a
          href="/upload"
          aria-label="Upload"
          className={cn(
            "ring-focus tap-44 col-span-1 mx-auto grid h-12 w-12 place-items-center rounded-2xl",
            "bg-primary text-white shadow-soft active:translate-y-px"
          )}
        >
          <span aria-hidden="true">⬆</span>
        </a>

        {right.map((it) => (
          <a
            key={it.href}
            href={it.href}
            aria-current={isActive(it.href) ? "page" : undefined}
            className={itemClass(isActive(it.href))}
          >
            <div className="text-lg" aria-hidden="true">{it.icon}</div>
            <div className="mt-0.5">{it.label}</div>
          </a>
        ))}
      </div>
    </nav>
  );
}
