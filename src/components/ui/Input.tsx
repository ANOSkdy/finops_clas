import { cn } from "@/lib/ui/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "focus-ring h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-inkMuted/70",
        className
      )}
      {...props}
    />
  );
}
