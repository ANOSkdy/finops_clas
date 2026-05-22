import { cn } from "@/lib/ui/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[var(--color-bg-secondary)]", className)} aria-hidden="true" />;
}
