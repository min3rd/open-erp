-- =====================================================================
-- V2.0.1: Backfill existing Sprint 01 tenants/users (TASK-275, TASK-271,
-- BR-RBAC-03, BR-RBAC-07, BR-RBAC-09, BUG-54, BUG-59)
-- Idempotent: safe to execute repeatedly. All data changes are inserts.
-- =====================================================================

-- 1) Default branch HQ for every existing tenant
INSERT INTO branches (tenant_id, code, name, is_default, status)
SELECT t.id, 'HQ', 'Trụ sở chính', TRUE, 'ACTIVE'
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM branches b WHERE b.tenant_id = t.id AND b.code = 'HQ'
)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 2) Default department GENERAL (bound to branch HQ) for every existing tenant
INSERT INTO departments (tenant_id, branch_id, parent_id, code, name, status)
SELECT t.id, b.id, NULL, 'GENERAL', 'Phòng ban chung', 'ACTIVE'
FROM tenants t
JOIN branches b ON b.tenant_id = t.id AND b.code = 'HQ'
WHERE NOT EXISTS (
    SELECT 1 FROM departments d WHERE d.tenant_id = t.id AND d.code = 'GENERAL'
)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 3) Primary membership (HQ / GENERAL) for every existing user_tenants row
INSERT INTO user_department_memberships (id, user_id, tenant_id, branch_id, department_id, is_primary, joined_at)
SELECT gen_random_uuid(), ut.user_id, ut.tenant_id, b.id, d.id, TRUE, COALESCE(ut.joined_at, NOW())
FROM user_tenants ut
JOIN branches b ON b.tenant_id = ut.tenant_id AND b.code = 'HQ'
JOIN departments d ON d.tenant_id = ut.tenant_id AND d.code = 'GENERAL'
WHERE NOT EXISTS (
    SELECT 1 FROM user_department_memberships m
    WHERE m.user_id = ut.user_id AND m.is_primary = TRUE
)
ON CONFLICT DO NOTHING;

-- 4) Primary branch assignment (HQ) for every existing user_tenants row.
--    can_manage = FALSE: this row only provides the default branch for CREATE,
--    it must not grant BRANCH-scope management rights (BR-RBAC-09).
INSERT INTO user_branch_assignments (id, user_id, tenant_id, branch_id, is_primary, can_manage, assigned_at)
SELECT gen_random_uuid(), ut.user_id, ut.tenant_id, b.id, TRUE, FALSE, COALESCE(ut.joined_at, NOW())
FROM user_tenants ut
JOIN branches b ON b.tenant_id = ut.tenant_id AND b.code = 'HQ'
WHERE NOT EXISTS (
    SELECT 1 FROM user_branch_assignments a
    WHERE a.user_id = ut.user_id AND a.is_primary = TRUE
)
ON CONFLICT DO NOTHING;

-- 5) Map legacy user_tenants.role to user_roles system roles (BUG-54 / TASK-271):
--    OWNER -> TENANT_OWNER, ADMIN/TENANT_ADMIN -> TENANT_ADMIN,
--    MEMBER -> STAFF, VIEWER -> VIEWER. Unknown values are skipped.
INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_at)
SELECT ut.user_id, ut.tenant_id, r.id, COALESCE(ut.joined_at, NOW())
FROM user_tenants ut
JOIN roles r ON r.tenant_id IS NULL AND r.code = CASE UPPER(ut.role)
    WHEN 'OWNER' THEN 'TENANT_OWNER'
    WHEN 'ADMIN' THEN 'TENANT_ADMIN'
    WHEN 'TENANT_ADMIN' THEN 'TENANT_ADMIN'
    WHEN 'MEMBER' THEN 'STAFF'
    WHEN 'VIEWER' THEN 'VIEWER'
END
ON CONFLICT (user_id, tenant_id, role_id) DO NOTHING;

COMMENT ON COLUMN user_tenants.role IS 'DEPRECATED (TASK-271 / BUG-54): official role source is roles + user_roles, kept only for rollback and to be removed in a later sprint.';
