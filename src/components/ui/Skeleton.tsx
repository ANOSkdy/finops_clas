import { cn } from "@/lib/ui/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-zinc-800/60", className)} aria-hidden="true" />;
}