-- Plugin-local activity trail for attendance user actions.
CREATE TABLE IF NOT EXISTS plg_attendance_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    actor_user_id uuid,
    action varchar(64) NOT NULL,
    entity_type varchar(64),
    entity_id uuid,
    detail jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_tenant_created
    ON plg_attendance_audit_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_tenant_action
    ON plg_attendance_audit_logs (tenant_id, action, created_at DESC);
