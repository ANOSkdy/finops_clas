"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function ConfirmDialog({ open, onOpenChange, title, description, children, actions }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children?: ReactNode; actions: ReactNode }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay" /><DialogPrimitive.Content className="dialog-content"><DialogPrimitive.Title asChild><h2>{title}</h2></DialogPrimitive.Title><DialogPrimitive.Description className="dialog-description">{description}</DialogPrimitive.Description>{children}<div className="dialog-actions">{actions}</div></DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>;
}
