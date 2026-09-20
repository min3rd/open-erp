-- =====================================================================
-- V3.0.3: Sprint 03 - Seed core plugin permissions + grant tenant roles
-- BUG-102 (QA): tenant plugin APIs were blocked because core:plugin:*
-- permissions were never created/granted outside tests.
-- PostgreSQL 16+, schema public. Idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Permission catalog (is_system = FALSE: tenant-grantable, keeps the
--    SchemaFoundationTest invariant that all is_system=TRUE rows are the
--    fixed core catalog).
-- ---------------------------------------------------------------------
INSERT INTO permissions (code, domain, resource, action, description_key, is_system)
VALUES
    ('core:plugin:read',            'core', 'plugin', 'read',            'PERM_CORE_PLUGIN_READ',            FALSE),
    ('core:plugin:install',         'core', 'plugin', 'install',         'PERM_CORE_PLUGIN_INSTALL',         FALSE),
    ('core:plugin:manage',          'core', 'plugin', 'manage',          'PERM_CORE_PLUGIN_MANAGE',          FALSE),
    ('core:plugin:credential:manage', 'core', 'plugin', 'credential:manage', 'PERM_CORE_PLUGIN_CREDENTIAL_MANAGE', FALSE),
    ('core:plugin:register-custom', 'core', 'plugin', 'register-custom', 'PERM_CORE_PLUGIN_REGISTER_CUSTOM', FALSE)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Grant catalog + lifecycle + credentials to tenant administrators.
--    The global system roles (roles.tenant_id IS NULL) are shared by all
--    tenants, so existing and future tenants are covered at once.
-- ---------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
  AND p.code IN ('core:plugin:read', 'core:plugin:install', 'core:plugin:manage',
                 'core:plugin:credential:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. Custom private plugin registration is owner-only (still gated by
--    tenants.allow_custom_plugins at the API layer).
-- ---------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'TENANT_OWNER'
  AND p.code = 'core:plugin:register-custom'
ON CONFLICT (role_id, permission_id) DO NOTHING;
