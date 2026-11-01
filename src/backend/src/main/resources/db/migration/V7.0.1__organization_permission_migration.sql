-- Sprint 07 / TASK-429: organization permission namespace migration.
-- New permissions are granted to every role that had the legacy Core permission.
-- Legacy rows are kept until the big-bang cutover; they are not used by the new plugin.

INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
    ('organization:org:manage', 'organization', 'org', 'manage', 'PERM_ORGANIZATION_ORG_MANAGE', TRUE),
    ('organization:branch:read', 'organization', 'branch', 'read', 'PERM_ORGANIZATION_BRANCH_READ', TRUE),
    ('organization:branch:manage', 'organization', 'branch', 'manage', 'PERM_ORGANIZATION_BRANCH_MANAGE', TRUE),
    ('organization:department:read', 'organization', 'department', 'read', 'PERM_ORGANIZATION_DEPARTMENT_READ', TRUE),
    ('organization:department:manage', 'organization', 'department', 'manage', 'PERM_ORGANIZATION_DEPARTMENT_MANAGE', TRUE),
    ('organization:membership:read', 'organization', 'membership', 'read', 'PERM_ORGANIZATION_MEMBERSHIP_READ', TRUE),
    ('organization:membership:manage', 'organization', 'membership', 'manage', 'PERM_ORGANIZATION_MEMBERSHIP_MANAGE', TRUE),
    ('organization:branch-access:read', 'organization', 'branch-access', 'read', 'PERM_ORGANIZATION_BRANCH_ACCESS_READ', TRUE),
    ('organization:branch-access:manage', 'organization', 'branch-access', 'manage', 'PERM_ORGANIZATION_BRANCH_ACCESS_MANAGE', TRUE),
    ('organization:org-chart:read', 'organization', 'org-chart', 'read', 'PERM_ORGANIZATION_ORG_CHART_READ', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, np.id
FROM role_permissions rp
JOIN permissions op ON op.id = rp.permission_id
JOIN permissions np ON np.code = CASE op.code
    WHEN 'core:organization:manage' THEN 'organization:org:manage'
    WHEN 'core:branch:read' THEN 'organization:branch:read'
    WHEN 'core:branch:manage' THEN 'organization:branch:manage'
    WHEN 'core:department:read' THEN 'organization:department:read'
    WHEN 'core:department:manage' THEN 'organization:department:manage'
    WHEN 'core:membership:read' THEN 'organization:membership:read'
    WHEN 'core:membership:manage' THEN 'organization:membership:manage'
    WHEN 'core:branch-assignment:read' THEN 'organization:branch-access:read'
    WHEN 'core:branch-assignment:manage' THEN 'organization:branch-access:manage'
    ELSE NULL
END
WHERE op.domain = 'core'
ON CONFLICT (role_id, permission_id) DO NOTHING;
