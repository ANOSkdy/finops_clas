import { cn } from "@/lib/ui/cn";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={cn(
        "focus-ring w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink placeholder:text-inkMuted/70",
        className
      )}
      {...props}
    />
  );
}
