import { cn } from "@/lib/ui/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  const base =
    "focus-ring inline-flex items-center justify-center gap-2 rounded-full font-medium leading-none transition motion-safe:duration-150 active:translate-y-px disabled:pointer-events-none";

  const sizes = size === "lg" ? "h-12 px-5 text-sm" : "h-11 px-4 text-sm";

  const variants =
    variant === "primary"
      ? "bg-[color:var(--primary)] text-white shadow-sm hover:bg-[color:var(--primary)]/90"
      : variant === "secondary"
        ? "bg-[color:var(--secondary)] text-white shadow-sm hover:bg-[color:var(--secondary)]/90"
        : variant === "outline"
          ? "border border-line bg-white text-ink shadow-sm hover:bg-[color:var(--primary)]/10"
        : variant === "danger"
          ? "bg-accent2 text-white shadow-sm hover:bg-accent2/90"
          : "border border-transparent bg-transparent text-ink hover:bg-[color:var(--primary)]/10";

  const disabled =
    variant === "outline" || variant === "ghost"
      ? "disabled:bg-[color:var(--primary)]/10 disabled:text-inkMuted disabled:border-line"
      : variant === "secondary"
        ? "disabled:bg-[color:var(--secondary)]/60 disabled:text-white/90 disabled:shadow-none"
        : "disabled:bg-[color:var(--primary)]/60 disabled:text-white/90 disabled:shadow-none";

  return (
    <button
      className={cn(base, sizes, variants, disabled, className)}
      {...props}
    />
  );
}
