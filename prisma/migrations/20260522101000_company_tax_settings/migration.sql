-- CreateTable
CREATE TABLE "company_tax_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "previous_corporate_tax_national_amount_yen" BIGINT,
    "is_consumption_tax_taxable_business" BOOLEAN NOT NULL DEFAULT false,
    "consumption_tax_reason" TEXT,
    "previous_consumption_tax_national_amount_yen" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_tax_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_tax_settings_company_id_key" ON "company_tax_settings"("company_id");

-- AddForeignKey
ALTER TABLE "company_tax_settings" ADD CONSTRAINT "company_tax_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
