CREATE TABLE IF NOT EXISTS task_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  remind_days_before integer NOT NULL,
  due_date_snapshot date NOT NULL,
  mail_to text NOT NULL,
  email_id uuid REFERENCES emails(id) ON DELETE SET NULL,
  sent_at timestamptz(6) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS task_reminder_logs_task_id_remind_days_before_due_date_snapshot_mail_to_key
  ON task_reminder_logs (task_id, remind_days_before, due_date_snapshot, mail_to);

CREATE INDEX IF NOT EXISTS task_reminder_logs_company_id_sent_at_idx
  ON task_reminder_logs (company_id, sent_at);
