"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextField } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/State";
import { ApiError, apiFetch } from "@/lib/api/client";
import { Icon } from "@/components/ui/Icon";

type Company = { id: string; name: string; legalForm: string; representativeName: string | null; email: string | null; roleInCompany: string; active: boolean };

export function CompanySelection({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState<string | null>(null);
  const filtered = useMemo(() => companies.filter((company) => company.name.toLocaleLowerCase("ja").includes(query.toLocaleLowerCase("ja"))), [companies, query]);
  async function choose(id: string) { setSwitching(id); try { await apiFetch<void>("/api/customer/select", { method: "POST", body: JSON.stringify({ companyId: id }) }); router.push("/home"); router.refresh(); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "切り替えできませんでした"); } finally { setSwitching(null); } }
  return <div className="page"><PageHeader title="会社を選択" description="操作する会社を選択してください。" actions={<Link className="button-link" href="/newcompany">会社を登録</Link>} />{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}{companies.length === 0 ? <EmptyState title="会社が登録されていません" message="会社を登録するとスケジュール管理を開始できます。" action={<Link className="button-link" href="/newcompany">会社を登録</Link>} /> : <><div className="toolbar"><TextField label="会社を検索" className="search-field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="会社名" /></div><div className="command-list">{filtered.map((company) => <button className="company-button" key={company.id} onClick={() => choose(company.id)} disabled={Boolean(switching)}><span className="monogram">{company.name.slice(0, 1)}</span><span><span className="company-name">{company.name}</span><span className="company-meta">{company.legalForm === "corporation" ? "法人" : "個人事業主"}{company.representativeName ? ` · ${company.representativeName}` : ""}</span></span>{switching === company.id ? <span className="spinner" /> : company.active ? <span aria-label="現在の会社"><Icon name="check" /></span> : <Icon name="arrow" />}</button>)}{filtered.length === 0 ? <EmptyState title="一致する会社がありません" message="検索条件を変更してください。" /> : null}</div></>}</div>;
}
