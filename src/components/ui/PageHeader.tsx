import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold leading-7 tracking-tight text-ink sm:text-xl sm:leading-8">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-inkMuted sm:leading-5">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="w-full shrink-0 [&_a]:block [&_button]:w-full sm:w-auto sm:[&_button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
