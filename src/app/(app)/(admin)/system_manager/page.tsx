import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
export default function SystemManagerPage() { return <div className="page"><PageHeader title="システム管理" description="アカウントと会社所属を安全に管理します。" /><div className="document-links"><Link className="document-link" href="/account"><h2>アカウント管理</h2><p>利用者の作成、検索、削除を行います。</p></Link><Link className="document-link" href="/company_member"><h2>会社メンバー</h2><p>利用者と会社の所属を管理します。</p></Link></div></div>; }
