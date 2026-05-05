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
    "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold leading-none transition motion-safe:duration-150 active:translate-y-px disabled:opacity-70";

  const sizes = size === "lg" ? "h-12 px-6 text-sm" : "h-11 px-5 text-sm";

  const variants =
    variant === "primary"
      ? "bg-action text-button shadow-softSm hover:bg-actionPressed"
      : variant === "secondary"
        ? "border border-line bg-transparent text-ink hover:border-primary/40 hover:bg-primary/10"
        : variant === "outline"
          ? "border border-line bg-panel text-ink hover:border-primary/40 hover:bg-primary/10"
        : variant === "danger"
          ? "bg-danger text-button shadow-softSm hover:bg-danger/90"
          : "border border-transparent bg-transparent text-ink hover:bg-primary/10";

  const disabled =
    variant === "primary" || variant === "danger"
      ? "disabled:bg-inkMuted/50 disabled:text-button disabled:shadow-none"
      : "disabled:border-line disabled:bg-transparent disabled:text-inkMuted";

  return (
    <button
      className={cn(base, sizes, variants, disabled, className)}
      {...props}
    />
  );
}
