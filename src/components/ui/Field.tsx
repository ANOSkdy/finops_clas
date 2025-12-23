"use client";

import * as React from "react";
import { cn } from "@/lib/ui/cn";

type Common = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  inputClassName?: string;
  labelClassName?: string;
};

type TextFieldProps = Common &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder">;

export function Field({
  label,
  required,
  hint,
  error,
  inputClassName,
  labelClassName,
  className,
  ...props
}: TextFieldProps) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "focus-ring peer h-11 w-full rounded-lg border bg-white px-3 pt-5 pb-2 text-sm text-ink",
            "border-line focus:border-[color:var(--primary)]",
            error ? "border-accent2 focus:border-accent2" : "",
            "placeholder:text-transparent shadow-softSm",
            inputClassName
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-3 top-2 text-xs text-inkMuted transition-all",
            "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-inkMuted",
            "peer-focus:top-2 peer-focus:text-xs peer-focus:text-ink",
            labelClassName
          )}
        >
          {label}{required ? <span className="text-accent2"> *</span> : null}
        </label>
      </div>

      {hint && <p id={hintId} className="text-xs text-inkMuted">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs text-accent2">{error}</p>}
    </div>
  );
}

type TextareaFieldProps = Common &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder">;

export function TextareaField({
  label,
  required,
  hint,
  error,
  inputClassName,
  labelClassName,
  className,
  ...props
}: TextareaFieldProps) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative">
        <textarea
          id={id}
          placeholder=" "
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "focus-ring peer min-h-[140px] w-full rounded-lg border bg-white px-3 pt-6 pb-3 text-sm text-ink",
            "border-line focus:border-[color:var(--primary)] resize-y shadow-softSm",
            error ? "border-accent2 focus:border-accent2" : "",
            "placeholder:text-transparent",
            inputClassName
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-3 top-2 text-xs text-inkMuted transition-all",
            "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-inkMuted",
            "peer-focus:top-2 peer-focus:text-xs peer-focus:text-ink",
            labelClassName
          )}
        >
          {label}{required ? <span className="text-accent2"> *</span> : null}
        </label>
      </div>

      {hint && <p id={hintId} className="text-xs text-inkMuted">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs text-accent2">{error}</p>}
    </div>
  );
}
