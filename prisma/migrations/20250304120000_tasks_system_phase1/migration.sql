-- Phase 1: system task metadata & idempotency support
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS template_version INTEGER,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta JSONB;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS schedule_signature TEXT;

-- Prevent duplicates for active system-generated tasks (used with skipDuplicates: true)
CREATE UNIQUE INDEX IF NOT EXISTS tasks_system_active_idx
  ON tasks (company_id, template_key, template_version, due_date, source)
  WHERE archived_at IS NULL AND source = 'system';
