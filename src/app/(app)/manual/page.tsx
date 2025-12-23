import Link from "next/link";
import { getManualDocs } from "@/lib/manual/getManualDocs";
import type { ManualDocListItem } from "@/lib/manual/docs";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export const revalidate = 60;

export default async function ManualPage() {
  let docs: ManualDocListItem[] = [];

  try {
    docs = await getManualDocs("updatedAtDesc");
  } catch {
    docs = [];
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">マニュアル</div>
        <div className="mt-1 text-sm text-inkMuted">一覧から詳細ページへ移動します。</div>
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">一覧</div>
        </CardHeader>
        <CardContent>
          {docs.length > 0 ? (
            <ul className="space-y-2">
              {docs.map((doc) => (
                <li key={doc.slug} className="glass rounded-2xl px-4 py-3">
                  <Link
                    className="focus-ring flex w-full items-center text-sm font-semibold text-ink"
                    href={`/manual/${doc.slug}`}
                  >
                    {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-inkMuted">マニュアルが未登録です。管理画面から追加してください。</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
