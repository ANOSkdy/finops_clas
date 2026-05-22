import { cn } from "@/lib/ui/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "focus-ring h-11 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/70",
        className
      )}
      {...props}
    />
  );
}
