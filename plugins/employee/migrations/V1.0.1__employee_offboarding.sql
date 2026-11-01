-- TASK-431: offboarding fields.
ALTER TABLE plg_employee_profiles
    ADD COLUMN IF NOT EXISTS exit_date DATE,
    ADD COLUMN IF NOT EXISTS exit_reason VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_employee_profile_tenant_exit
    ON plg_employee_profiles (tenant_id, exit_date);
