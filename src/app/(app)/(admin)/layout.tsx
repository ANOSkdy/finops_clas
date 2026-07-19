import { PageHeader } from "@/components/ui/PageHeader";
import { AppError } from "@/lib/api/errors";
import { requireGlobal } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try { await requireGlobal(); return children; }
  catch (error) {
    if (!(error instanceof AppError) || error.code !== "FORBIDDEN") throw error;
    return <div className="page"><PageHeader title="アクセスできません" /><div className="state" role="alert"><div><h2>システム管理者の権限が必要です</h2><p>この画面を利用する権限がありません。</p></div></div></div>;
  }
}
