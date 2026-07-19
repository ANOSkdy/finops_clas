import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { safeInternalPath } from "@/lib/auth/redirect";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (session) redirect(session.activeCompanyId ? "/home" : "/selectcompany");
  const query = await searchParams;
  return <div className="auth-page"><main className="auth-panel"><div className="product-mark"><span className="product-dot" />CLAS FinOps</div><h1>ログイン</h1><p className="muted">業務を続けるにはログインしてください。</p><LoginForm nextPath={safeInternalPath(query.next)} /></main></div>;
}
