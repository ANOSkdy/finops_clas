"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function UploadPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">アップロード</div>
        <div className="mt-1 text-sm text-inkMuted">用途を選び、各フロー専用ページに遷移します。</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">格付け（rating）</div>
            <div className="mt-1 text-sm text-inkMuted">決算書アップロードとスコア/グレード/AIコメント生成のフローへ移動します。</div>
          </CardHeader>
          <CardContent>
            <Link href="/rating">
              <Button className="w-full">格付けページへ進む</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">試算表（trial_balance）</div>
            <div className="mt-1 text-sm text-inkMuted">試算表アップロードとメール送信（監査ログ付き）のフローへ移動します。</div>
          </CardHeader>
          <CardContent>
            <Link href="/trial_balance">
              <Button className="w-full" variant="secondary">試算表ページへ進む</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
