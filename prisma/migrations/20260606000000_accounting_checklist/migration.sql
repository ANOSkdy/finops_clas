CREATE TABLE "accounting_checklist_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "accounting_checklist_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "accounting_checklist_items_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 100),
  CONSTRAINT "accounting_checklist_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "accounting_checklist_checks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "fiscal_year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "checked" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "accounting_checklist_checks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "accounting_checklist_checks_fiscal_year_check" CHECK ("fiscal_year" BETWEEN 2000 AND 2100),
  CONSTRAINT "accounting_checklist_checks_month_check" CHECK ("month" BETWEEN 1 AND 12),
  CONSTRAINT "accounting_checklist_checks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "accounting_checklist_checks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "accounting_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "accounting_checklist_items_company_id_name_key" ON "accounting_checklist_items"("company_id", "name");
CREATE INDEX "accounting_checklist_items_company_id_sort_order_idx" ON "accounting_checklist_items"("company_id", "sort_order");
CREATE UNIQUE INDEX "accounting_checklist_checks_company_id_item_id_fiscal_year_month_key" ON "accounting_checklist_checks"("company_id", "item_id", "fiscal_year", "month");
CREATE INDEX "accounting_checklist_checks_company_id_fiscal_year_idx" ON "accounting_checklist_checks"("company_id", "fiscal_year");
