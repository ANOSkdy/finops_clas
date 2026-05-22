"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/toast";

type LegalForm = "corporation" | "sole";
type PaymentSchedule = "monthly" | "special";
type ConsumptionTaxReason = "sales_over_10m" | "taxable_selection" | "invoice_registered" | "other";

type CompanyResponse = {
  company: {
    companyId: string;
    name: string;
    legalForm: LegalForm;
    address: string | null;
    fiscalClosingMonth: number;
    representativeName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    corporateNumber: string | null;
    establishedOn: string | null;
    withholdingIncomeTaxPaymentSchedule: PaymentSchedule | null;
    residentTaxPaymentSchedule: PaymentSchedule | null;
  };
  roleInCompany?: string | null;
  userRole?: string | null;
};

type RecurringTaxType = "fixed_asset_tax" | "ordinary_resident_tax" | "custom";

type RecurringTaxDueDate = {
  id: string;
  taxType: RecurringTaxType;
  title: string;
  installmentLabel: string | null;
  month: number;
  day: number;
  enabled: boolean;
  sortOrder: number;
};

type TaxSettingResponse = {
  taxSetting: {
    previousCorporateTaxNationalAmountYen: string | null;
    isConsumptionTaxTaxableBusiness: boolean;
    consumptionTaxReason: ConsumptionTaxReason | null;
    previousConsumptionTaxNationalAmountYen: string | null;
  };
};

export default function CompanyEditPage() {
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [taxBusy, setTaxBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const [legalForm, setLegalForm] = useState<LegalForm>("sole");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [fiscalClosingMonth, setFiscalClosingMonth] = useState(12);
  const [representativeName, setRepresentativeName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [corporateNumber, setCorporateNumber] = useState("");
  const [establishedOn, setEstablishedOn] = useState("");
  const [withholdingIncomeTaxPaymentSchedule, setWithholdingIncomeTaxPaymentSchedule] = useState<
    PaymentSchedule | ""
  >("");
  const [residentTaxPaymentSchedule, setResidentTaxPaymentSchedule] = useState<
    PaymentSchedule | ""
  >("");
  const [previousCorporateTaxNationalAmountYen, setPreviousCorporateTaxNationalAmountYen] = useState("");
  const [isConsumptionTaxTaxableBusiness, setIsConsumptionTaxTaxableBusiness] = useState(false);
  const [consumptionTaxReason, setConsumptionTaxReason] = useState<ConsumptionTaxReason | "">("");
  const [previousConsumptionTaxNationalAmountYen, setPreviousConsumptionTaxNationalAmountYen] = useState("");
  const [dueDates, setDueDates] = useState<RecurringTaxDueDate[]>([]);
  const [dueDateBusy, setDueDateBusy] = useState(false);
  const [newTaxType, setNewTaxType] = useState<RecurringTaxType>("fixed_asset_tax");
  const [newTitle, setNewTitle] = useState("");
  const [newInstallmentLabel, setNewInstallmentLabel] = useState("");
  const [newMonth, setNewMonth] = useState(1);
  const [newDay, setNewDay] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const res = await fetch("/api/customer", { credentials: "include" });
        if (res.status === 404) {
          setError("会社が選択されていません。先に会社を選択してください。");
          setLoaded(true);
          return;
        }
        if (!res.ok) {
          setError("会社情報の取得に失敗しました。");
          setLoaded(true);
          return;
        }
        const data = (await res.json()) as CompanyResponse;
        const company = data.company;
        setLegalForm(company.legalForm);
        setName(company.name ?? "");
        setAddress(company.address ?? "");
        setFiscalClosingMonth(company.fiscalClosingMonth ?? 12);
        setRepresentativeName(company.representativeName ?? "");
        setContactEmail(company.contactEmail ?? "");
        setContactPhone(company.contactPhone ?? "");
        setCorporateNumber(company.corporateNumber ?? "");
        setEstablishedOn(company.establishedOn ?? "");
        setWithholdingIncomeTaxPaymentSchedule(company.withholdingIncomeTaxPaymentSchedule ?? "");
        setResidentTaxPaymentSchedule(company.residentTaxPaymentSchedule ?? "");
        const isPrivileged =
          data.userRole === "global" ||
          data.userRole === "admin" ||
          data.roleInCompany === "admin";
        setCanEdit(isPrivileged);
        if (!isPrivileged) {
          setError("会社情報の修正は管理者またはグローバル管理者のみ実施できます。");
        }

        const taxRes = await fetch("/api/company/tax-settings", { credentials: "include" });
        if (taxRes.ok) {
          const taxData = (await taxRes.json()) as TaxSettingResponse;
          setPreviousCorporateTaxNationalAmountYen(
            taxData.taxSetting.previousCorporateTaxNationalAmountYen ?? ""
          );
          setIsConsumptionTaxTaxableBusiness(taxData.taxSetting.isConsumptionTaxTaxableBusiness);
          setConsumptionTaxReason(taxData.taxSetting.consumptionTaxReason ?? "");
          setPreviousConsumptionTaxNationalAmountYen(
            taxData.taxSetting.previousConsumptionTaxNationalAmountYen ?? ""
          );
        }

        const dueDateRes = await fetch("/api/company/recurring-tax-due-dates", { credentials: "include" });
        if (dueDateRes.ok) {
          const dueDateData = (await dueDateRes.json()) as { dueDates: RecurringTaxDueDate[] };
          setDueDates(dueDateData.dueDates);
        }
      } catch {
        setError("会社情報の取得に失敗しました。");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const monthDisabled = useMemo(() => legalForm === "sole", [legalForm]);
  const monthValue = monthDisabled ? 12 : fiscalClosingMonth;
  const corporateNumberValid =
    !corporateNumber || /^[0-9]{13}$/.test(corporateNumber);

  async function onSubmitTaxSettings() {
    if (!canEdit) return;
    try {
      setTaxBusy(true);
      const res = await fetch("/api/company/tax-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taxSetting: {
            previousCorporateTaxNationalAmountYen: previousCorporateTaxNationalAmountYen || null,
            isConsumptionTaxTaxableBusiness,
            consumptionTaxReason: isConsumptionTaxTaxableBusiness ? consumptionTaxReason || null : null,
            previousConsumptionTaxNationalAmountYen: previousConsumptionTaxNationalAmountYen || null,
          },
        }),
      });
      if (!res.ok) {
        toast({ variant: "error", title: "更新失敗", description: "税務設定の更新に失敗しました" });
        return;
      }
      const data = (await res.json()) as TaxSettingResponse;
      setPreviousCorporateTaxNationalAmountYen(data.taxSetting.previousCorporateTaxNationalAmountYen ?? "");
      setIsConsumptionTaxTaxableBusiness(data.taxSetting.isConsumptionTaxTaxableBusiness);
      setConsumptionTaxReason(data.taxSetting.consumptionTaxReason ?? "");
      setPreviousConsumptionTaxNationalAmountYen(data.taxSetting.previousConsumptionTaxNationalAmountYen ?? "");
      toast({ variant: "success", title: "更新完了", description: "税務設定を更新しました" });
    } catch {
      toast({ variant: "error", title: "更新失敗", description: "ネットワークを確認してください" });
    } finally {
      setTaxBusy(false);
    }
  }

  async function onSubmit() {
    if (!canEdit) return;
    try {
      setBusy(true);
      setError(null);

      if (!name.trim()) {
        setError("会社名は必須です。");
        toast({ variant: "error", description: "会社名を入力してください" });
        return;
      }

      if (!corporateNumberValid) {
        setError("法人番号は13桁の数字で入力してください。");
        toast({ variant: "error", description: "法人番号は13桁の数字で入力してください" });
        return;
      }

      const res = await fetch("/api/customer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          company: {
            name: name.trim(),
            address: address || null,
            fiscalClosingMonth: monthValue,
            representativeName: representativeName || null,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
            corporateNumber: corporateNumber || null,
            establishedOn: establishedOn || null,
            withholdingIncomeTaxPaymentSchedule:
              withholdingIncomeTaxPaymentSchedule || null,
            residentTaxPaymentSchedule: residentTaxPaymentSchedule || null,
          },
        }),
      });

      if (!res.ok) {
        const message =
          res.status === 403
            ? "管理者のみ更新できます。"
            : "会社情報の更新に失敗しました。";
        setError(message);
        toast({ variant: "error", title: "更新失敗", description: message });
        return;
      }

      toast({ variant: "success", title: "更新完了", description: "会社情報を更新しました" });
    } catch {
      setError("会社情報の更新に失敗しました。");
      toast({ variant: "error", title: "更新失敗", description: "ネットワークを確認してください" });
    } finally {
      setBusy(false);
    }
  }


  async function addDueDate() {
    if (!canEdit) return;
    setDueDateBusy(true);
    try {
      const res = await fetch("/api/company/recurring-tax-due-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dueDate: { taxType: newTaxType, title: newTitle, installmentLabel: newInstallmentLabel || null, month: newMonth, day: newDay, enabled: true, sortOrder: 0 } }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { dueDate: RecurringTaxDueDate };
      setDueDates((prev) => [...prev, data.dueDate]);
      setNewTitle("");
      setNewInstallmentLabel("");
      toast({ variant: "success", title: "追加完了", description: "納期限を追加しました" });
    } catch {
      toast({ variant: "error", title: "追加失敗", description: "入力値を確認してください" });
    } finally { setDueDateBusy(false); }
  }

  async function toggleDueDate(id: string, enabled: boolean) {
    if (!canEdit) return;
    const res = await fetch(`/api/company/recurring-tax-due-dates/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ dueDate: { enabled } }) });
    if (!res.ok) return;
    setDueDates((prev) => prev.map((row) => (row.id === id ? { ...row, enabled } : row)));
  }

  async function deleteDueDate(id: string) {
    if (!canEdit) return;
    const res = await fetch(`/api/company/recurring-tax-due-dates/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) return;
    setDueDates((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">会社情報を修正</div>
        <div className="mt-1 text-sm text-inkMuted">登録済みの会社情報を編集します。</div>
      </div>

      {!loaded && (
        <div className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-inkMuted">
          読み込み中…
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-accent2/35 bg-panel px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">基本情報</div>
          <div className="mt-1 text-sm text-inkMuted">
            法人種別は変更できません。個人事業主の場合、決算月は12月固定です。
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="法人種別" value={legalForm === "corporation" ? "法人" : "個人事業主"} disabled />
          <Field label="会社名" required value={name} onChange={(e) => setName(e.target.value)} disabled={busy || !canEdit} />
          <Field label="所在地" value={address} onChange={(e) => setAddress(e.target.value)} disabled={busy || !canEdit} />
          <Field label="法人番号" inputMode="numeric" maxLength={13} value={corporateNumber} onChange={(e) => setCorporateNumber(e.target.value)} disabled={busy || !canEdit} error={corporateNumberValid ? null : "13桁の数字で入力してください"} />
          <Field label="設立年月日" type="date" value={establishedOn} onChange={(e) => setEstablishedOn(e.target.value)} disabled={busy || !canEdit} />
          <Field label="決算月" type="number" inputMode="numeric" min={1} max={12} value={String(monthValue)} onChange={(e) => setFiscalClosingMonth(Number(e.target.value))} disabled={busy || !canEdit || monthDisabled} hint={monthDisabled ? "個人事業主は12月固定です" : "1〜12"} />
          <Field label="代表者名" value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} disabled={busy || !canEdit} />
          <Field label="連絡先Email" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} disabled={busy || !canEdit} />
          <Field label="連絡先TEL" type="tel" inputMode="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} disabled={busy || !canEdit} />
          <SelectField label="源泉所得税 納付特例" value={withholdingIncomeTaxPaymentSchedule} onChange={(e) => setWithholdingIncomeTaxPaymentSchedule(e.target.value as PaymentSchedule | "")} disabled={busy || !canEdit} placeholder="選択してください">
            <option value="monthly">毎月納付</option>
            <option value="special">納期特例（年2回）</option>
          </SelectField>
          <SelectField label="住民税 納付特例" value={residentTaxPaymentSchedule} onChange={(e) => setResidentTaxPaymentSchedule(e.target.value as PaymentSchedule | "")} disabled={busy || !canEdit} placeholder="選択してください">
            <option value="monthly">毎月納付</option>
            <option value="special">納期特例（年2回）</option>
          </SelectField>
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={onSubmit} disabled={busy || !canEdit}>{busy ? "更新中…" : "更新する"}</Button>
            <a href="/settings" className="focus-ring tap-44 inline-flex items-center justify-center rounded-xl bg-[color:rgb(var(--button))] px-3 text-sm text-button shadow-sm hover:bg-[color:rgb(var(--button))]/90">設定へ戻る</a>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">税務スケジュール設定</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="前期法人税（国税）額" inputMode="numeric" value={previousCorporateTaxNationalAmountYen} onChange={(e) => setPreviousCorporateTaxNationalAmountYen(e.target.value)} disabled={taxBusy || !canEdit} />
          <SelectField label="消費税の課税事業者" value={isConsumptionTaxTaxableBusiness ? "true" : "false"} onChange={(e) => setIsConsumptionTaxTaxableBusiness(e.target.value === "true")} disabled={taxBusy || !canEdit}>
            <option value="false">いいえ</option>
            <option value="true">はい</option>
          </SelectField>
          <SelectField label="消費税課税事業者の理由" value={consumptionTaxReason} onChange={(e) => setConsumptionTaxReason(e.target.value as ConsumptionTaxReason | "")} disabled={taxBusy || !canEdit || !isConsumptionTaxTaxableBusiness} placeholder="選択してください">
            <option value="sales_over_10m">2事業年度前の課税売上高が1,000万円超</option>
            <option value="taxable_selection">消費税課税事業者選択届出書を提出</option>
            <option value="invoice_registered">インボイス登録</option>
            <option value="other">その他</option>
          </SelectField>
          <Field label="前年度消費税（国税分）" inputMode="numeric" value={previousConsumptionTaxNationalAmountYen} onChange={(e) => setPreviousConsumptionTaxNationalAmountYen(e.target.value)} disabled={taxBusy || !canEdit} />
          <Button onClick={onSubmitTaxSettings} disabled={taxBusy || !canEdit}>{taxBusy ? "更新中…" : "税務設定を更新する"}</Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><div className="text-base font-semibold">自治体別・任意納期限設定</div></CardHeader>
        <CardContent className="space-y-3">
          <SelectField label="税目" value={newTaxType} onChange={(e) => setNewTaxType(e.target.value as RecurringTaxType)} disabled={dueDateBusy || !canEdit}>
            <option value="fixed_asset_tax">固定資産税</option>
            <option value="ordinary_resident_tax">個人住民税（普通徴収）</option>
            <option value="custom">その他</option>
          </SelectField>
          <Field label="表示名" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} disabled={dueDateBusy || !canEdit} />
          <Field label="期別" value={newInstallmentLabel} onChange={(e) => setNewInstallmentLabel(e.target.value)} disabled={dueDateBusy || !canEdit} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="月" type="number" min={1} max={12} value={String(newMonth)} onChange={(e) => setNewMonth(Number(e.target.value))} disabled={dueDateBusy || !canEdit} />
            <Field label="日" type="number" min={1} max={31} value={String(newDay)} onChange={(e) => setNewDay(Number(e.target.value))} disabled={dueDateBusy || !canEdit} />
          </div>
          <Button onClick={addDueDate} disabled={dueDateBusy || !canEdit || !newTitle.trim()}>追加する</Button>
          <div className="space-y-2">
            {dueDates.map((row) => (
              <div key={row.id} className="rounded-xl border border-line p-3 text-sm">
                <div>{row.title}{row.installmentLabel ? `（${row.installmentLabel}）` : ""} / {row.month}/{row.day}</div>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary" onClick={() => toggleDueDate(row.id, !row.enabled)} disabled={!canEdit}>{row.enabled ? "無効化" : "有効化"}</Button>
                  <Button variant="ghost" onClick={() => deleteDueDate(row.id)} disabled={!canEdit}>削除</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
