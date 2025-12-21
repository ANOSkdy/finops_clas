import { cn } from "@/lib/ui/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "ring-focus h-11 w-full rounded-xl border border-border bg-zinc-900/40 px-3 text-sm text-zinc-100 placeholder:text-zinc-500",
        className
      )}
      {...props}
    />
  );
}