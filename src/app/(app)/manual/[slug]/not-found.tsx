import Link from "next/link";
import { EmptyState } from "@/components/ui/State";
export default function ManualNotFound() { return <div className="page"><EmptyState title="マニュアルが見つかりません" message="削除されたか、公開されていない可能性があります。" action={<Link className="button-link" href="/manual">一覧へ戻る</Link>} /></div>; }
