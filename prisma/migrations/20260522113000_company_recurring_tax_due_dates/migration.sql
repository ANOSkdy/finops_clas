CREATE TABLE "company_recurring_tax_due_dates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "tax_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "installment_label" TEXT,
  "month" INTEGER NOT NULL,
  "day" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "company_recurring_tax_due_dates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_recurring_tax_due_dates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "company_recurring_tax_due_dates_company_id_enabled_idx" ON "company_recurring_tax_due_dates"("company_id", "enabled");
CREATE INDEX "company_recurring_tax_due_dates_company_id_tax_type_idx" ON "company_recurring_tax_due_dates"("company_id", "tax_type");
