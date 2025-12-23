import { cn } from "@/lib/ui/cn";

const memoTones = [
  "default",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "cyan",
  "blue",
  "purple",
  "pink",
  "brown",
  "gray",
] as const;

export type MemoTone = (typeof memoTones)[number];

type MemoCardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: MemoTone;
};

export function MemoCard({ className, tone = "default", ...props }: MemoCardProps) {
  return (
    <div
      data-tone={tone === "default" ? undefined : tone}
      className={cn("memo-card", className)}
      {...props}
    />
  );
}

export function MemoGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("memo-grid", className)} {...props} />;
}
