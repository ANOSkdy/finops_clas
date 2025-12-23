"use client";

import * as React from "react";
import { cn } from "@/lib/ui/cn";

type ToastVariant = "default" | "success" | "error";

type ToastItem = {
  id: string;
  title?: string;
  description: string;
  variant: ToastVariant;
  durationMs: number;
};

type ToastInput = {
  title?: string;
  description: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (t: ToastInput) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const timers = React.useRef<Map<string, number>>(new Map());

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) window.clearTimeout(tm);
    timers.current.delete(id);
  }, []);

  const clear = React.useCallback(() => {
    for (const tm of timers.current.values()) window.clearTimeout(tm);
    timers.current.clear();
    setItems([]);
  }, []);

  const toast = React.useCallback(
    (t: ToastInput) => {
      const id = makeId();
      const item: ToastItem = {
        id,
        title: t.title,
        description: t.description,
        variant: t.variant ?? "default",
        durationMs: t.durationMs ?? (t.variant === "error" ? 7000 : 4500),
      };

      setItems((prev) => [item, ...prev].slice(0, 5));
      const tm = window.setTimeout(() => dismiss(id), item.durationMs);
      timers.current.set(id, tm);
    },
    [dismiss]
  );

  React.useEffect(() => () => clear(), [clear]);

  const value = React.useMemo(() => ({ toast, dismiss, clear }), [toast, dismiss, clear]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function tone(variant: ToastVariant) {
  if (variant === "success") return "border-secondary/40 bg-secondary/15 text-ink";
  if (variant === "error") return "border-accent2/40 bg-accent2/10 text-ink";
  return "border-line bg-panel/90 text-ink";
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-[95] mx-auto w-full max-w-xl px-4 safe-bottom pointer-events-none"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <div className="space-y-2 pointer-events-auto">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={cn("rounded-2xl border px-4 py-3 shadow-sm backdrop-blur", tone(t.variant))}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {t.title && <div className="text-sm font-semibold tracking-tight">{t.title}</div>}
                <div className={cn("text-sm", t.title ? "mt-1" : "")}>{t.description}</div>
              </div>

              <button
                className="focus-ring tap-44 grid place-items-center rounded-xl text-sm opacity-80 hover:opacity-100"
                onClick={() => onDismiss(t.id)}
                aria-label="閉じる"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
