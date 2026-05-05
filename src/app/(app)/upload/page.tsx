"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ActionCard } from "@/components/ui/ActionCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function UploadPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="アップロード"
        description="用途を選び、各フロー専用ページに進みます。"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          icon="📄"
          title="格付け"
          description="決算書をアップロードし、スコア・グレード・AIコメントを生成します。"
          meta="対応: PDF / CSV / Excel"
          action={
            <Link href="/rating" prefetch>
              <Button className="w-full">格付けページへ進む</Button>
            </Link>
          }
        />

        <ActionCard
          icon="📊"
          title="試算表"
          description="試算表をアップロードし、メール送信と監査ログ保存に進みます。"
          meta="対応: CSV / Excel"
          action={
            <Link href="/trial_balance" prefetch>
              <Button className="w-full" variant="secondary">試算表ページへ進む</Button>
            </Link>
          }
        />
      </div>
    </div>
  );
}
