"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export function ErrorDetailsDialog({
  open,
  onOpenChange,
  title = "エラー詳細",
  description = "必要に応じて内容を共有してください（機密情報は含めない）。",
  details,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  details: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
          <DialogClose asChild>
            <button className="ring-focus tap-44 rounded-xl px-2 text-sm text-inkMuted" type="button" aria-label="閉じる">
              ✕
            </button>
          </DialogClose>
        </div>

        <pre className="mt-4 max-h-[50vh] overflow-auto rounded-2xl border border-line bg-base p-3 text-xs text-ink whitespace-pre-wrap">
{details}
        </pre>

        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary" type="button">閉じる</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
