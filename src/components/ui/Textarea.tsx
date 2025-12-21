import { cn } from "@/lib/ui/cn";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={cn(
        "ring-focus w-full rounded-xl border border-border bg-zinc-900/40 px-3 py-2 text-sm text-fg placeholder:text-zinc-500",
        className
      )}
      {...props}
    />
  );
}