BEGIN;

-- Align legacy Neon column names with the current Prisma schema without
-- rewriting the stored values. Every rename is conditional so this migration
-- is also safe after the repository's initial migration on a clean database.
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'login_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'loginId') THEN
    ALTER TABLE "users" RENAME COLUMN "login_id" TO "loginId";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'contact_email')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'email') THEN
    ALTER TABLE "companies" RENAME COLUMN "contact_email" TO "email";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'contact_phone')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'phone') THEN
    ALTER TABLE "companies" RENAME COLUMN "contact_phone" TO "phone";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'fiscal_closing_month')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'closing_month') THEN
    ALTER TABLE "companies" RENAME COLUMN "fiscal_closing_month" TO "closing_month";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'last_seen_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'last_accessed_at') THEN
    ALTER TABLE "sessions" RENAME COLUMN "last_seen_at" TO "last_accessed_at";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_tax_settings' AND column_name = 'is_consumption_tax_taxable_business')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_tax_settings' AND column_name = 'is_taxable') THEN
    ALTER TABLE "company_tax_settings" RENAME COLUMN "is_consumption_tax_taxable_business" TO "is_taxable";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_tax_settings' AND column_name = 'previous_corporate_tax_national_amount_yen')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_tax_settings' AND column_name = 'previous_corporate_tax_yen') THEN
    ALTER TABLE "company_tax_settings" RENAME COLUMN "previous_corporate_tax_national_amount_yen" TO "previous_corporate_tax_yen";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_tax_settings' AND column_name = 'previous_consumption_tax_national_amount_yen')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_tax_settings' AND column_name = 'previous_consumption_tax_yen') THEN
    ALTER TABLE "company_tax_settings" RENAME COLUMN "previous_consumption_tax_national_amount_yen" TO "previous_consumption_tax_yen";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounting_checklist_items' AND column_name = 'sort_order')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounting_checklist_items' AND column_name = 'position') THEN
    ALTER TABLE "accounting_checklist_items" RENAME COLUMN "sort_order" TO "position";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'task_reminder_deliveries' AND column_name = 'error')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'task_reminder_deliveries' AND column_name = 'error_code') THEN
    ALTER TABLE "task_reminder_deliveries" RENAME COLUMN "error" TO "error_code";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'uploads' AND column_name = 'original_filename')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'uploads' AND column_name = 'original_name') THEN
    ALTER TABLE "uploads" RENAME COLUMN "original_filename" TO "original_name";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'uploads' AND column_name = 'size_bytes')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'uploads' AND column_name = 'size') THEN
    ALTER TABLE "uploads" RENAME COLUMN "size_bytes" TO "size";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'emails' AND column_name = 'mail_to')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'emails' AND column_name = 'recipient') THEN
    ALTER TABLE "emails" RENAME COLUMN "mail_to" TO "recipient";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'emails' AND column_name = 'error')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'emails' AND column_name = 'error_code') THEN
    ALTER TABLE "emails" RENAME COLUMN "error" TO "error_code";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'manual_documents' AND column_name = 'content_md')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'manual_documents' AND column_name = 'content') THEN
    ALTER TABLE "manual_documents" RENAME COLUMN "content_md" TO "content";
  END IF;
END
$migration$;

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "postal_code" VARCHAR(12),
  ADD COLUMN IF NOT EXISTS "schedule_dirty_at" TIMESTAMPTZ(3);

ALTER TABLE "company_tax_settings"
  ADD COLUMN IF NOT EXISTS "withholding_special" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "resident_tax_special" BOOLEAN;

DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'withholding_income_tax_payment_schedule') THEN
    UPDATE "company_tax_settings" AS setting
    SET "withholding_special" = (company."withholding_income_tax_payment_schedule" = 'special')
    FROM "companies" AS company
    WHERE company."id" = setting."company_id" AND setting."withholding_special" IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'resident_tax_payment_schedule') THEN
    UPDATE "company_tax_settings" AS setting
    SET "resident_tax_special" = (company."resident_tax_payment_schedule" = 'special')
    FROM "companies" AS company
    WHERE company."id" = setting."company_id" AND setting."resident_tax_special" IS NULL;
  END IF;
END
$migration$;

UPDATE "company_tax_settings" SET "withholding_special" = false WHERE "withholding_special" IS NULL;
UPDATE "company_tax_settings" SET "resident_tax_special" = false WHERE "resident_tax_special" IS NULL;
ALTER TABLE "company_tax_settings"
  ALTER COLUMN "withholding_special" SET DEFAULT false,
  ALTER COLUMN "withholding_special" SET NOT NULL,
  ALTER COLUMN "resident_tax_special" SET DEFAULT false,
  ALTER COLUMN "resident_tax_special" SET NOT NULL;

ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "generated" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "rule_version" VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ(3);
UPDATE "tasks" SET "generated" = false WHERE "generated" IS NULL;
UPDATE "tasks" SET "rule_version" = 'legacy-neon' WHERE "rule_version" IS NULL;
UPDATE "tasks" SET "completed_at" = "updated_at" WHERE "status" = 'done' AND "completed_at" IS NULL;
ALTER TABLE "tasks"
  ALTER COLUMN "generated" SET DEFAULT true,
  ALTER COLUMN "generated" SET NOT NULL,
  ALTER COLUMN "rule_version" SET DEFAULT 'clas-asis-1',
  ALTER COLUMN "rule_version" SET NOT NULL;

ALTER TABLE "task_reminder_deliveries"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ratings"
  ADD COLUMN IF NOT EXISTS "highlights" TEXT[],
  ADD COLUMN IF NOT EXISTS "ai_source" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "score_version" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "prompt_version" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "model_version" VARCHAR(100);
UPDATE "ratings" SET "ai_comment" = '' WHERE "ai_comment" IS NULL;
UPDATE "ratings" SET "highlights" = ARRAY[]::TEXT[] WHERE "highlights" IS NULL;
UPDATE "ratings" SET "ai_source" = 'fallback' WHERE "ai_source" IS NULL;
UPDATE "ratings" SET "score_version" = 'metadata-v1' WHERE "score_version" IS NULL;
UPDATE "ratings" SET "prompt_version" = 'rating-ja-v1' WHERE "prompt_version" IS NULL;
ALTER TABLE "ratings"
  ALTER COLUMN "ai_comment" SET NOT NULL,
  ALTER COLUMN "highlights" SET NOT NULL,
  ALTER COLUMN "ai_source" SET DEFAULT 'fallback',
  ALTER COLUMN "ai_source" SET NOT NULL,
  ALTER COLUMN "score_version" SET DEFAULT 'metadata-v1',
  ALTER COLUMN "score_version" SET NOT NULL,
  ALTER COLUMN "prompt_version" SET DEFAULT 'rating-ja-v1',
  ALTER COLUMN "prompt_version" SET NOT NULL;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'uploads' AND column_name = 'size' AND data_type = 'bigint'
  ) THEN
    IF EXISTS (SELECT 1 FROM "uploads" WHERE "size" > 2147483647 OR "size" < 0) THEN
      RAISE EXCEPTION 'uploads.size contains a value outside the Prisma Int range';
    END IF;
    ALTER TABLE "uploads" ALTER COLUMN "size" TYPE INTEGER USING "size"::INTEGER;
  END IF;
END
$migration$;

ALTER TABLE "uploads"
  ADD COLUMN IF NOT EXISTS "storage_url" VARCHAR(2000),
  ADD COLUMN IF NOT EXISTS "access_mode" VARCHAR(20);
UPDATE "uploads" SET "storage_url" = "storage_key" WHERE "storage_url" IS NULL;
UPDATE "uploads" SET "access_mode" = 'private' WHERE "access_mode" IS NULL;
ALTER TABLE "uploads"
  ALTER COLUMN "storage_url" SET NOT NULL,
  ALTER COLUMN "access_mode" SET DEFAULT 'private',
  ALTER COLUMN "access_mode" SET NOT NULL;

ALTER TABLE "emails"
  ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMPTZ(3);
UPDATE "emails" SET "idempotency_key" = 'legacy-' || "id"::TEXT WHERE "idempotency_key" IS NULL;
ALTER TABLE "emails" ALTER COLUMN "idempotency_key" SET NOT NULL;

ALTER TABLE "manual_documents" ADD COLUMN IF NOT EXISTS "published" BOOLEAN;
UPDATE "manual_documents" SET "published" = true WHERE "published" IS NULL;
ALTER TABLE "manual_documents"
  ALTER COLUMN "published" SET DEFAULT true,
  ALTER COLUMN "published" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "upload_grants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "purpose" VARCHAR(30) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "size" INTEGER NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID,
  "actor_user_id" UUID,
  "action" VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" VARCHAR(100),
  "result" VARCHAR(30) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounting_checklist_items_company_id_name_key"
  ON "accounting_checklist_items"("company_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_company_task_key_key"
  ON "tasks"("company_id", "task_key");
CREATE UNIQUE INDEX IF NOT EXISTS "uploads_company_storage_provider_storage_key_key"
  ON "uploads"("company_id", "storage_provider", "storage_key");
CREATE UNIQUE INDEX IF NOT EXISTS "emails_company_idempotency_key_key"
  ON "emails"("company_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "upload_grants_company_expiry_idx"
  ON "upload_grants"("company_id", "expires_at");
CREATE INDEX IF NOT EXISTS "audit_company_created_idx"
  ON "audit_logs"("company_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_actor_created_idx"
  ON "audit_logs"("actor_user_id", "created_at");

COMMIT;
