import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/ui/cn";

export function ActionCard({
  title,
  description,
  meta,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  meta?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("glass h-full", className)}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {icon ? (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-lg text-primary">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-base font-semibold leading-6 text-ink">{title}</div>
          {description ? (
            <div className="mt-1 text-sm leading-6 text-inkMuted sm:leading-5">{description}</div>
          ) : null}
          {meta ? <div className="mt-2 text-xs leading-5 text-inkMuted sm:leading-4">{meta}</div> : null}
        </div>
      </CardHeader>
      {action ? <CardContent className="pt-4 [&_a]:block [&_button]:w-full">{action}</CardContent> : null}
    </Card>
  );
}
