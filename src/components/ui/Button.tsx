import { cn } from "@/lib/ui/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  const base =
    "ring-focus inline-flex items-center justify-center gap-2 rounded-xl font-medium transition motion-safe:duration-150 disabled:opacity-60 disabled:pointer-events-none active:translate-y-px";

  const sizes = size === "lg" ? "h-12 px-5 text-sm" : "h-11 px-4 text-sm";

  const variants =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary/90 shadow-softSm"
      : variant === "secondary"
        ? "bg-white/90 text-primary hover:bg-primary/10 border border-primary/20 shadow-softSm"
        : variant === "danger"
          ? "bg-accent2 text-white hover:bg-accent2/90 shadow-softSm"
          : "bg-transparent text-primary hover:bg-primary/10 border border-transparent";

  return <button className={cn(base, sizes, variants, className)} {...props} />;
}
