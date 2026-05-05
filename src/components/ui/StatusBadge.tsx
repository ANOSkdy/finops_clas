import { cn } from "@/lib/ui/cn";

type Tone = "default" | "warning" | "success" | "danger" | "primary";

const toneClass: Record<Tone, string> = {
  default: "border-line bg-panel text-ink",
  warning: "border-accent1/45 bg-accent1/15 text-ink",
  success: "border-secondary/45 bg-secondary/10 text-ink",
  danger: "border-accent2/45 bg-accent2/10 text-ink",
  primary: "border-primary/45 bg-primary/10 text-primary",
};

export function StatusBadge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold leading-none",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
