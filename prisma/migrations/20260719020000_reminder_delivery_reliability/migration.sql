-- Canonicalize old reminder names before adding the retry scheduler.  When both
-- names exist, retain sent rows first and then the most useful timestamped row.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY task_id, channel,
             CASE remind_key
               WHEN '7d_before' THEN 'd-7' WHEN '3d_before' THEN 'd-3'
               WHEN '1d_before' THEN 'd-1' WHEN 'today' THEN 'd-0'
               ELSE remind_key END
           ORDER BY (status = 'sent') DESC, sent_at DESC NULLS LAST, updated_at DESC, id DESC
         ) AS position
  FROM task_reminder_deliveries
)
DELETE FROM task_reminder_deliveries d USING ranked r WHERE d.id = r.id AND r.position > 1;

UPDATE task_reminder_deliveries
SET remind_key = CASE remind_key
  WHEN '7d_before' THEN 'd-7' WHEN '3d_before' THEN 'd-3'
  WHEN '1d_before' THEN 'd-1' WHEN 'today' THEN 'd-0'
  ELSE remind_key END
WHERE remind_key IN ('7d_before', '3d_before', '1d_before', 'today');

ALTER TABLE task_reminder_deliveries
  ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN next_attempt_at TIMESTAMPTZ(3),
  ADD COLUMN last_attempt_at TIMESTAMPTZ(3);

-- Existing failed rows were historically retryable, so make them eligible once.
UPDATE task_reminder_deliveries
SET next_attempt_at = CURRENT_TIMESTAMP
WHERE status = 'failed';

CREATE INDEX task_reminder_status_next_attempt_idx
  ON task_reminder_deliveries (status, next_attempt_at);
