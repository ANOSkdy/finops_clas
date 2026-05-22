import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type PageTitleProps = {
  children: ReactNode;
  subtitle?: ReactNode;
  className?: string;
};

export function PageTitle({ children, subtitle, className }: PageTitleProps) {
  return (
    <div className={cn("mb-5", className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{children}</h1>
      {subtitle ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p> : null}
    </div>
  );
}
