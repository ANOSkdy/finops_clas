"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/toast";

type LegalForm = "corporation" | "sole";

export default function NewCompanyPage() {
  const { toast } = useToast();

  const [legalForm, setLegalForm] = useState<LegalForm>("sole");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [fiscalClosingMonth, setFiscalClosingMonth] = useState(12);
  const [representativeName, setRepresentativeName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthDisabled = useMemo(() => legalForm === "sole", [legalForm]);
  const monthValue = monthDisabled ? 12 : fiscalClosingMonth;

  async function onSubmit() {
    try {
      setBusy(true);
      setError(null);

      if (!name.trim()) {
        setError("会社名は必須です。");
        toast({ variant: "error", description: "会社名を入力してください" });
        return;
      }

      const res = await fetch("/api/customer/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          legalForm,
          address: address || null,
          fiscalClosingMonth: monthValue,
          representativeName: representativeName || null,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
        }),
      });

      if (!res.ok) {
        setError("会社の登録に失敗しました。");
        toast({ variant: "error", title: "登録失敗", description: "入力内容とログイン状態を確認してください" });
        return;
      }

      toast({ variant: "success", title: "登録完了", description: "会社を登録しました" });
      // API側で active_company_id を設定しているので、そのまま Home へ
      window.location.href = "/home";
    } catch {
      setError("会社の登録に失敗しました。");
      toast({ variant: "error", title: "登録失敗", description: "ネットワークを確認してください" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">会社を登録</div>
        <div className="mt-1 text-sm text-inkMuted">
          個人事業主の場合、決算月は12月固定です（サーバ側でも強制）。
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-accent2/35 bg-accent2/10 px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}

      <Card className="glass">
        <CardHeader>
          <div className="text-base font-semibold">基本情報</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLegalForm("sole")}
              className={`ring-focus tap-44 rounded-xl border px-3 py-2 text-sm ${
                legalForm === "sole"
                  ? "border-primary bg-primary/20 text-primary shadow-softSm"
                  : "border-primary/50 bg-base text-primary hover:bg-primary/10"
              }`}
            >
              個人事業主
            </button>
            <button
              type="button"
              onClick={() => setLegalForm("corporation")}
              className={`ring-focus tap-44 rounded-xl border px-3 py-2 text-sm ${
                legalForm === "corporation"
                  ? "border-primary bg-primary/20 text-primary shadow-softSm"
                  : "border-primary/50 bg-base text-primary hover:bg-primary/10"
              }`}
            >
              法人
            </button>
          </div>

          <Field
            label="会社名"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />

          <Field
            label="所在地"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={busy}
          />

          <Field
            label="決算月"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={String(monthValue)}
            onChange={(e) => setFiscalClosingMonth(Number(e.target.value))}
            disabled={busy || monthDisabled}
            hint={monthDisabled ? "個人事業主は12月固定です" : "1〜12"}
          />

          <Field
            label="代表者名"
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            disabled={busy}
          />

          <Field
            label="連絡先Email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={busy}
          />

          <Field
            label="連絡先TEL"
            type="tel"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            disabled={busy}
          />

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={onSubmit} disabled={busy}>
              {busy ? "登録中…" : "登録する"}
            </Button>
            <a href="/selectcompany" className="ring-focus tap-44 inline-flex items-center justify-center rounded-xl px-3 text-sm text-primary underline">
              会社選択へ
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
