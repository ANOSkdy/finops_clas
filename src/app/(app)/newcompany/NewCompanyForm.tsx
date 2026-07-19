"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SelectField, TextField } from "@/components/ui/Field";
import { ApiError, apiFetch } from "@/lib/api/client";

export function NewCompanyForm() {
  const router = useRouter();
  const [form, setForm] = useState({ legalForm: "corporation", name: "", closingMonth: "3", representativeName: "", email: "", phone: "", postalCode: "", address: "" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const field = (key: keyof typeof form) => ({ value: form[key], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: event.target.value }) });
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { await apiFetch("/api/customer/new", { method: "POST", body: JSON.stringify({ ...form, closingMonth: Number(form.legalForm === "sole_proprietor" ? 12 : form.closingMonth), email: form.email || null }) }); router.push("/home"); router.refresh(); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "会社を登録できませんでした"); } finally { setBusy(false); } }
  return <div className="page"><PageHeader title="会社登録" description="会社情報を登録し、操作対象として選択します。" /><form className="form-section" onSubmit={submit}>{error ? <div className="alert alert-danger" role="alert">{error}</div> : null}<div className="form-grid"><SelectField label="事業形態" requiredLabel {...field("legalForm")}><option value="corporation">法人</option><option value="sole_proprietor">個人事業主</option></SelectField><SelectField label="決算月" requiredLabel value={form.legalForm === "sole_proprietor" ? "12" : form.closingMonth} onChange={(event) => setForm({ ...form, closingMonth: event.target.value })} disabled={form.legalForm === "sole_proprietor"}>{Array.from({ length: 12 }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1}月</option>)}</SelectField><TextField label="会社名" requiredLabel className="span-2" {...field("name")} /><TextField label="代表者名" {...field("representativeName")} /><TextField label="連絡先メール" type="email" {...field("email")} /><TextField label="電話番号" {...field("phone")} /><TextField label="郵便番号" {...field("postalCode")} /><TextField label="所在地" className="span-2" {...field("address")} /></div><div className="form-actions"><Button type="submit" busy={busy} disabled={!form.name}>会社を登録</Button></div></form></div>;
}
