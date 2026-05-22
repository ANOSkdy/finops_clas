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
    "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold leading-none transition motion-safe:duration-150 active:translate-y-px disabled:cursor-not-allowed";

  const sizes = size === "lg" ? "h-12 px-6 text-sm" : "h-11 px-5 text-sm";

  const variants =
    variant === "primary"
      ? "bg-[var(--color-surface-primary)] text-[var(--color-text-invert)] shadow-[var(--shadow-elevation-1)] hover:bg-[var(--color-surface-primary-hover)]"
      : variant === "secondary"
        ? "bg-[var(--color-surface-quaternary)] text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-surface-quaternary)_84%,var(--color-surface-primary)_16%)]"
        : variant === "outline"
          ? "border border-[var(--color-border-default)] bg-[var(--color-surface-normal)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-secondary)]"
          : variant === "danger"
            ? "bg-[var(--color-danger)] text-[var(--color-text-invert)] shadow-[var(--shadow-elevation-1)] hover:bg-[color-mix(in_srgb,var(--color-danger)_90%,var(--color-surface-primary))]"
            : "bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]";

  const disabled =
    variant === "primary" || variant === "danger"
      ? "disabled:bg-[var(--color-text-disabled)] disabled:text-[var(--color-text-invert)] disabled:shadow-none"
      : "disabled:border-[var(--color-border-default)] disabled:bg-transparent disabled:text-[var(--color-text-disabled)]";

  return (
    <button
      className={cn(base, sizes, variants, disabled, className)}
      {...props}
    />
  );
}
