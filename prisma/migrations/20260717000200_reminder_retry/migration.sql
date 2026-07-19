ALTER TABLE "task_reminder_deliveries"
ADD COLUMN "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "users"
ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('user', 'admin', 'global'));

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_category_check" CHECK ("category" IN ('tax', 'labor', 'other'));

ALTER TABLE "task_reminder_deliveries"
ADD CONSTRAINT "task_reminder_status_check" CHECK ("status" IN ('queued', 'sent', 'failed'));

ALTER TABLE "upload_grants"
ADD CONSTRAINT "upload_grants_size_check" CHECK ("size" > 0);

ALTER TABLE "uploads"
ADD CONSTRAINT "uploads_size_check" CHECK ("size" > 0),
ADD CONSTRAINT "uploads_access_mode_check" CHECK ("access_mode" = 'private');

ALTER TABLE "ratings"
ADD CONSTRAINT "ratings_score_check" CHECK ("score" BETWEEN 0 AND 100),
ADD CONSTRAINT "ratings_ai_source_check" CHECK ("ai_source" IN ('fallback', 'gemini'));

ALTER TABLE "emails"
ADD CONSTRAINT "emails_status_check" CHECK ("status" IN ('queued', 'sent', 'failed'));
