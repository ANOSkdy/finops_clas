import { cn } from "@/lib/ui/cn";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={cn(
        "ring-focus w-full rounded-xl border border-line bg-white/90 px-3 py-2 text-sm text-ink placeholder:text-inkMuted/70",
        className
      )}
      {...props}
    />
  );
}
