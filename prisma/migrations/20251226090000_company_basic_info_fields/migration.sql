-- Add columns
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS corporate_number VARCHAR(13),
  ADD COLUMN IF NOT EXISTS established_on DATE,
  ADD COLUMN IF NOT EXISTS withholding_income_tax_payment_schedule TEXT,
  ADD COLUMN IF NOT EXISTS resident_tax_payment_schedule TEXT;

-- Add check constraints (NOT VALID)
ALTER TABLE companies
  ADD CONSTRAINT companies_corporate_number_format_chk
    CHECK (corporate_number IS NULL OR corporate_number ~ '^[0-9]{13}$') NOT VALID;

ALTER TABLE companies
  ADD CONSTRAINT companies_withholding_income_tax_payment_schedule_chk
    CHECK (
      withholding_income_tax_payment_schedule IS NULL
      OR withholding_income_tax_payment_schedule IN ('monthly', 'special')
    ) NOT VALID;

ALTER TABLE companies
  ADD CONSTRAINT companies_resident_tax_payment_schedule_chk
    CHECK (
      resident_tax_payment_schedule IS NULL
      OR resident_tax_payment_schedule IN ('monthly', 'special')
    ) NOT VALID;

-- Validate constraints
ALTER TABLE companies VALIDATE CONSTRAINT companies_corporate_number_format_chk;
ALTER TABLE companies VALIDATE CONSTRAINT companies_withholding_income_tax_payment_schedule_chk;
ALTER TABLE companies VALIDATE CONSTRAINT companies_resident_tax_payment_schedule_chk;
