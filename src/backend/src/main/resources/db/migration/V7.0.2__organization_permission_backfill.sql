-- Sprint 07 / TASK-429: complete the organization permission migration.
-- V7.0.1 created the write permissions and copied grants from legacy codes.
-- This migration adds the read code and restores the system-role semantics
-- (owner/admin all, general manager/viewer read, staff organization read).

INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
    ('organization:org:read', 'organization', 'org', 'read', 'PERM_ORGANIZATION_ORG_READ', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
  AND p.domain = 'organization'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL AND r.code IN ('GENERAL_MANAGER', 'VIEWER')
  AND p.domain = 'organization' AND p.action IN ('read', 'export')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL AND r.code = 'STAFF'
  AND p.code = 'organization:org:read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, np.id
FROM role_permissions rp
JOIN permissions op ON op.id = rp.permission_id
JOIN permissions np ON np.code = 'organization:org:read'
WHERE op.code = 'core:organization:read'
ON CONFLICT (role_id, permission_id) DO NOTHING;
