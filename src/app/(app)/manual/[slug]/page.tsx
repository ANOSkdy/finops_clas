import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getManualDocBySlug } from "@/lib/manual/getManualDocs";

type ManualDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function ManualDetailPage({ params }: ManualDetailPageProps) {
  const { slug } = await params;
  const doc = await getManualDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Link className="text-sm text-primary underline" href="/manual">
          ← 一覧に戻る
        </Link>
        <div className="text-xl font-semibold tracking-tight">{doc.title}</div>
      </div>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">本文</div>
        </CardHeader>
        <CardContent>
          {doc.contentMd ? (
            <pre className="whitespace-pre-wrap text-sm text-ink">{doc.contentMd.trim()}</pre>
          ) : (
            <div className="text-sm text-inkMuted">本文がありません。</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
