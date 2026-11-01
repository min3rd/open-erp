-- Sprint 07: grant plugin permissions to TENANT_ADMIN for existing installs.
-- New plugin installs already grant owner+admin in PluginPermissionSeeder.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'TENANT_ADMIN'
  AND p.domain <> 'core'
ON CONFLICT (role_id, permission_id) DO NOTHING;
