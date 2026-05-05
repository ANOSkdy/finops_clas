import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="focus-ring sr-only fixed left-3 top-3 z-[90] rounded-lg bg-panel px-3 py-2 text-sm text-primary shadow-softSm focus:not-sr-only"
      >
        本文へスキップ
      </a>

      <div className="min-h-screen">
        <AppHeader />
        <main id="main" className="mx-auto w-full max-w-[1080px] px-3 pt-4 pb-safe-nav sm:px-6 sm:pt-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}
