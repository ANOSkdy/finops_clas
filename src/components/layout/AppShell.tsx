"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Icon, type IconName } from "@/components/ui/Icon";

type Company = { id: string; name: string; legalForm: string; roleInCompany: string };
type Props = { user: { name: string; role: string }; activeCompanyId: string | null; companies: Company[]; children: React.ReactNode };
type NavGroup = { label: string; links: readonly (readonly [string, string, IconName])[] };
const groups: readonly NavGroup[] = [
  { label: "概要", links: [["ホーム", "/home", "home"]] },
  { label: "業務", links: [["スケジュール", "/schedule", "calendar"], ["会計資料チェック", "/accounting_checklist", "checklist"]] },
  { label: "財務", links: [["財務格付け", "/rating", "rating"], ["試算表送付", "/trial_balance", "send"]] },
  { label: "ナレッジ", links: [["マニュアル", "/manual", "manual" ]] },
  { label: "設定", links: [["会社設定", "/company_edit", "settings"], ["個人設定", "/settings", "user"]] }
];
export function AppShell({ user, activeCompanyId, companies, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [companyOpen, setCompanyOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const gPressed = useRef(false);
  const active = companies.find((company) => company.id === activeCompanyId) ?? null;
  const navGroups = useMemo<readonly NavGroup[]>(() => user.role === "global" ? [...groups, { label: "管理", links: [["システム管理", "/system_manager", "admin"]] }] : groups, [user.role]);

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable=true]")) return;
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") { event.preventDefault(); setCompanyOpen(true); return; }
      if (event.key === "g") { gPressed.current = true; window.setTimeout(() => { gPressed.current = false; }, 800); return; }
      if (gPressed.current) {
        const route: Record<string, string> = { h: "/home", s: "/schedule", a: "/accounting_checklist", m: "/manual" };
        if (route[event.key]) router.push(route[event.key]);
        gPressed.current = false;
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [router]);

  async function selectCompany(companyId: string) {
    setSwitching(companyId);
    try {
      await apiFetch<void>("/api/customer/select", { method: "POST", body: JSON.stringify({ companyId }) });
      setCompanyOpen(false);
      router.push("/home");
      router.refresh();
    } finally { setSwitching(null); }
  }

  function setTheme(theme: "dark" | "light") {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("clas-theme", theme);
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">本文へ移動</a>
    <div className="main-column">
      <header className="topbar">
        <div className="topbar-leading">
          <button className="header-menu-button" onClick={() => setNavigationOpen(true)} aria-label="メニューを開く" aria-haspopup="dialog"><Icon name="menu" /></button>
          <Link className="header-brand" href="/home" aria-label="CLAS FinOps ホーム"><span className="product-dot" aria-hidden="true" /><span>CLAS FinOps</span></Link>
        </div>
        <div className="topbar-actions">
          <button className="compact-company-button" onClick={() => setCompanyOpen(true)} aria-haspopup="dialog" title={active?.name ?? "会社を選択"}><span className="monogram" aria-hidden="true">{active?.name.slice(0, 1) ?? "–"}</span><span>{active?.name ?? "会社を選択"}</span><Icon name="chevron" size={16} /></button>
          <Link className="account-button" href="/settings" title={user.name}><span className="monogram" aria-hidden="true">{user.name.slice(0, 1)}</span><span>{user.name}</span></Link>
          <button className="icon-button" onClick={() => setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light")} aria-label="テーマを切り替える"><Icon name="theme" /></button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </div>

    <Dialog.Root open={companyOpen} onOpenChange={setCompanyOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content"><Dialog.Title asChild><h2>会社を切り替える</h2></Dialog.Title><Dialog.Description className="dialog-description">操作対象の会社を選択します。切り替え後は新しい会社のデータを読み込みます。</Dialog.Description><div className="command-list">{companies.length === 0 ? <p className="muted">所属する会社がありません。</p> : companies.map((company) => <button className="company-button" key={company.id} onClick={() => selectCompany(company.id)} disabled={Boolean(switching)}><span className="monogram">{company.name.slice(0, 1)}</span><span><span className="company-name">{company.name}</span><span className="company-meta">{company.roleInCompany}</span></span>{switching === company.id ? <span className="spinner" /> : company.id === activeCompanyId ? <span aria-label="選択中"><Icon name="check" /></span> : null}</button>)}</div><div className="dialog-actions"><Link className="button-link" href="/selectcompany" onClick={() => setCompanyOpen(false)}>会社選択画面</Link><Dialog.Close className="button button-secondary">閉じる</Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={navigationOpen} onOpenChange={setNavigationOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content drawer-content"><Dialog.Title asChild><h2>ナビゲーション</h2></Dialog.Title><Dialog.Description className="dialog-description">移動する画面を選択します。</Dialog.Description><div className="command-list">{navGroups.flatMap((group) => group.links).map(([label, href, icon]) => <Link className="command-link" data-active={pathname === href || pathname.startsWith(`${href}/`)} href={href} key={href} onClick={() => setNavigationOpen(false)}><span className="command-label"><Icon name={icon} />{label}</span></Link>)}</div><div className="dialog-actions"><Dialog.Close className="button button-secondary">閉じる</Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
