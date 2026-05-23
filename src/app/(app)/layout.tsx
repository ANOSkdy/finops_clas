import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainContainer } from "@/components/ui/MainContainer";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="focus-ring sr-only fixed left-3 top-3 z-[90] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-normal)] px-3 py-2 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-elevation-1)] focus:not-sr-only"
      >
        本文へスキップ
      </a>

      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <AppHeader />
        <main id="main" className="t-page-shell min-w-0 max-w-full overflow-x-hidden pt-6">
          <MainContainer>{children}</MainContainer>
        </main>
      </div>
    </>
  );
}
