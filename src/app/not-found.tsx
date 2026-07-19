import Link from "next/link";
import { EmptyState } from "@/components/ui/State";
export default function NotFound() { return <div className="auth-page"><main className="auth-panel"><EmptyState title="ページが見つかりません" message="URLをご確認ください。" action={<Link className="button-link" href="/">ホームへ戻る</Link>} /></main></div>; }
