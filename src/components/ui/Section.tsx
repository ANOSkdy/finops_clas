import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type SectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2> : null}
      {description ? <p className="text-sm text-[var(--color-text-secondary)]">{description}</p> : null}
      {children}
    </section>
  );
}
