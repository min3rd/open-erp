-- Sprint 07: every tenant member can read their own in-app notifications.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code IN ('GENERAL_MANAGER', 'STAFF', 'VIEWER')
  AND p.code = 'in-app-notification:notification:read'
ON CONFLICT (role_id, permission_id) DO NOTHING;
