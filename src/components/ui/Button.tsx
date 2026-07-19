import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"; busy?: boolean; children: ReactNode };

export function Button({ variant = "primary", busy = false, disabled, children, className = "", ...props }: Props) {
  return <button className={`button button-${variant} ${className}`} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>{busy ? <span className="spinner" aria-hidden="true" /> : null}{children}</button>;
}
