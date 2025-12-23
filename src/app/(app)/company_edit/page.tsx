"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/toast";

type LegalForm = "corporation" | "sole";

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
  };
  roleInCompany?: string | null;
  userRole?: string | null;
};

export default function CompanyEditPage() {
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const [legalForm, setLegalForm] = useState<LegalForm>("sole");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [fiscalClosingMonth, setFiscalClosingMonth] = useState(12);
  const [representativeName, setRepresentativeName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

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
        const isAdmin = data.userRole === "admin" || data.roleInCompany === "admin";
        setCanEdit(isAdmin);
        if (!isAdmin) {
          setError("会社情報の修正は管理者のみ実施できます。");
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
        <div role="alert" className="rounded-2xl border border-accent2/35 bg-accent2/10 px-4 py-3 text-sm text-ink">
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
          <Field
            label="法人種別"
            value={legalForm === "corporation" ? "法人" : "個人事業主"}
            disabled
          />

          <Field
            label="会社名"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy || !canEdit}
          />

          <Field
            label="所在地"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={busy || !canEdit}
          />

          <Field
            label="決算月"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={String(monthValue)}
            onChange={(e) => setFiscalClosingMonth(Number(e.target.value))}
            disabled={busy || !canEdit || monthDisabled}
            hint={monthDisabled ? "個人事業主は12月固定です" : "1〜12"}
          />

          <Field
            label="代表者名"
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            disabled={busy || !canEdit}
          />

          <Field
            label="連絡先Email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={busy || !canEdit}
          />

          <Field
            label="連絡先TEL"
            type="tel"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            disabled={busy || !canEdit}
          />

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={onSubmit} disabled={busy || !canEdit}>
              {busy ? "更新中…" : "更新する"}
            </Button>
            <a href="/settings" className="focus-ring tap-44 inline-flex items-center justify-center rounded-xl px-3 text-sm text-primary underline">
              設定へ戻る
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
