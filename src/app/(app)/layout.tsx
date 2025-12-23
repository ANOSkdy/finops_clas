import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="focus-ring sr-only fixed left-3 top-3 z-[90] rounded-xl bg-base/90 px-3 py-2 text-sm text-primary focus:not-sr-only"
      >
        本文へスキップ
      </a>

      <div className="min-h-screen">
        <AppHeader />
        <main
          id="main"
          className="mx-auto w-full max-w-5xl px-4 pt-6 pb-safe-nav sm:px-6"
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}
