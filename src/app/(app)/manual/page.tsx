import Link from "next/link";
import { getManualDocs } from "@/lib/manual/getManualDocs";
import type { ManualDocListItem } from "@/lib/manual/docs";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const revalidate = 60;

export default async function ManualPage() {
  let docs: ManualDocListItem[] = [];

  try {
    docs = await getManualDocs("updatedAtDesc");
  } catch {
    docs = [];
  }

  return (
    <div className="space-y-5">
      <PageHeader title="マニュアル" description="一覧から詳細ページへ移動します。" />

      {docs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.slug} className="glass">
              <CardHeader>
                <div className="text-base font-semibold leading-6 text-ink">{doc.title}</div>
                <div className="mt-1 text-xs text-inkMuted">マニュアル</div>
              </CardHeader>
              <CardContent className="pt-4">
                <Link href={`/manual/${doc.slug}`}>
                  <Button variant="secondary" className="w-full">詳細を見る</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass">
          <CardHeader>
            <div className="text-base font-semibold">マニュアルが未登録です</div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-inkMuted">管理画面から追加してください。</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
