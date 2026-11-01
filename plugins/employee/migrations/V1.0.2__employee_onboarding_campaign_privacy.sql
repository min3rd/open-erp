-- TASK-432/433/434: onboarding payload, campaign/privacy support and guards.
ALTER TABLE plg_employee_onboarding_invites
    ADD COLUMN IF NOT EXISTS payload JSONB;

-- PostgreSQL treats NULL scope_id values as distinct in the original unique
-- constraint; this partial index makes TENANT-scope config rows upsertable.
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_approval_scope_null
    ON plg_employee_approval_config (tenant_id, scope_type, field_group, step_no)
    WHERE scope_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_employee_onboarding_tenant_status
    ON plg_employee_onboarding_invites (tenant_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_employee_campaign_tenant_status
    ON plg_employee_update_campaigns (tenant_id, status, deadline);
