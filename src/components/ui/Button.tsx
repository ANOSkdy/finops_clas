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
      ? "bg-[color:var(--plum-700)] text-white shadow-sm hover:bg-[color:var(--plum-800)]"
      : variant === "secondary"
        ? "bg-[color:var(--salmon-700)] text-white shadow-sm hover:bg-[color:var(--salmon-800)]"
        : variant === "outline"
          ? "border border-line bg-white text-ink shadow-sm hover:bg-[color:var(--plum-500)]/10"
        : variant === "danger"
          ? "bg-accent2 text-white shadow-sm hover:bg-accent2/90"
          : "border border-transparent bg-transparent text-ink hover:bg-[color:var(--plum-500)]/10";

  const disabled =
    variant === "outline" || variant === "ghost"
      ? "disabled:bg-[color:var(--plum-500)]/10 disabled:text-inkMuted disabled:border-line"
      : "disabled:bg-[color:var(--plum-500)]/50 disabled:text-white/90 disabled:shadow-none";

  return (
    <button
      className={cn(base, sizes, variants, disabled, className)}
      {...props}
    />
  );
}
