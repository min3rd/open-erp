-- =====================================================================
-- V3.1.0: Sprint 04 - Tenant UI theme preference (TASK-357, DES-API-S04-001)
-- Theme is a per-tenant workspace setting; mode (light/dark) stays per user
-- in the browser. Idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tenant UI preference column (default keeps the current look).
-- ---------------------------------------------------------------------
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ui_theme VARCHAR(32) NOT NULL DEFAULT 'industrial';

-- ---------------------------------------------------------------------
-- 2. Permission catalog (is_system = FALSE: tenant-grantable).
-- ---------------------------------------------------------------------
INSERT INTO permissions (code, domain, resource, action, description_key, is_system)
VALUES
    ('core:tenant:settings-manage', 'core', 'tenant', 'settings-manage', 'PERM_CORE_TENANT_SETTINGS_MANAGE', FALSE)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. Grant to tenant administrators (global system roles cover all tenants).
-- ---------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
  AND p.code = 'core:tenant:settings-manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;
