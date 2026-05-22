-- CreateTable
CREATE TABLE "task_reminder_deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "remind_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sent_at" TIMESTAMPTZ(6),
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_reminder_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_reminder_deliveries_task_id_channel_remind_key_key" ON "task_reminder_deliveries"("task_id", "channel", "remind_key");

-- CreateIndex
CREATE INDEX "task_reminder_deliveries_status_created_at_idx" ON "task_reminder_deliveries"("status", "created_at");

-- AddForeignKey
ALTER TABLE "task_reminder_deliveries" ADD CONSTRAINT "task_reminder_deliveries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
