ALTER TABLE "public"."tasks"
  ADD COLUMN "task_key" TEXT,
  ADD COLUMN "period_start" DATE,
  ADD COLUMN "period_end" DATE;

CREATE INDEX "tasks_company_id_task_key_idx"
  ON "public"."tasks"("company_id", "task_key");

CREATE UNIQUE INDEX "tasks_company_id_task_key_unique_not_null"
  ON "public"."tasks"("company_id", "task_key")
  WHERE "task_key" IS NOT NULL;
