import { cn } from "@/lib/ui/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-primary/10", className)} aria-hidden="true" />;
}
