-- Sprint 07: default employee role grants for non-admin system roles.
-- TENANT_OWNER/TENANT_ADMIN receive every plugin permission at install time.
-- These defaults make manager and employee self-service usable without custom roles.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND (
    (r.code = 'GENERAL_MANAGER' AND p.code IN (
      'employee:profile:read', 'employee:self:read', 'employee:self:update',
      'employee:document:read', 'employee:directory:read', 'employee:org-chart:read'))
    OR (r.code = 'STAFF' AND p.code IN (
      'employee:self:read', 'employee:self:update', 'employee:document:read',
      'employee:directory:read', 'employee:org-chart:read'))
    OR (r.code = 'VIEWER' AND p.code IN (
      'employee:profile:read', 'employee:directory:read', 'employee:org-chart:read'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
