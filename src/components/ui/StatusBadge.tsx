import { cn } from "@/lib/ui/cn";

type StatusTone = "default" | "success" | "danger" | "caution";

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
};

export function StatusBadge({ children, tone = "default", className }: StatusBadgeProps) {
  const toneClass =
    tone === "success"
      ? "bg-[var(--color-success-subdued)] text-[var(--color-success)]"
      : tone === "danger"
        ? "bg-[var(--color-danger-subdued)] text-[var(--color-danger)]"
        : tone === "caution"
          ? "bg-[var(--color-caution-subdued)] text-[var(--color-caution)]"
          : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}
