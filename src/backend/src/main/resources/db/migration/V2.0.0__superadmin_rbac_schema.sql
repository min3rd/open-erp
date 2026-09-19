-- =====================================================================
-- V2.0.0: Sprint 02 - Super Admin, Organization & RBAC Schema
-- DES-02-DB / SOL-01 / SOL-02 / TASK-267 / TASK-268 / TASK-276 / BUG-66
-- PostgreSQL 16+, schema public. All statements are idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tenants extension (DES-02-DB section 2.1)
-- ---------------------------------------------------------------------
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(32) NOT NULL DEFAULT 'STANDARD';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INT NOT NULL DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_storage_mb INT NOT NULL DEFAULT 5120;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS allowed_plugins JSONB DEFAULT '["core"]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_tenants_plan_tier ON tenants(plan_tier);
CREATE INDEX IF NOT EXISTS idx_tenants_is_locked ON tenants(is_locked);
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends ON tenants(trial_ends_at);

-- ---------------------------------------------------------------------
-- 2. Platform layer (DES-02-DB section 2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'SUPER_ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    two_factor_required BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    disabled_at TIMESTAMP WITH TIME ZONE,
    disabled_by UUID REFERENCES users(id),
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_platform_admin_user UNIQUE(user_id),
    CONSTRAINT chk_platform_admin_role CHECK (role IN ('SUPER_ADMIN', 'SUPPORT_ENGINEER')),
    CONSTRAINT chk_platform_admin_status CHECK (status IN ('INVITED', 'ACTIVE', 'DISABLED', 'REVOKED')),
    CONSTRAINT chk_platform_admin_active_status CHECK (is_active = (status = 'ACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_platform_super_admins_active ON platform_super_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_super_admins_status ON platform_super_admins(status);

CREATE TABLE IF NOT EXISTS platform_impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_user_id UUID NOT NULL REFERENCES users(id),
    target_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    support_ticket VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL DEFAULT 'STARTED',
    CONSTRAINT chk_impersonation_status CHECK (status IN ('STARTED', 'ENDED', 'TIMEOUT'))
);

CREATE INDEX IF NOT EXISTS idx_imp_logs_super_admin ON platform_impersonation_logs(super_admin_user_id);
CREATE INDEX IF NOT EXISTS idx_imp_logs_tenant ON platform_impersonation_logs(target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_imp_logs_ticket ON platform_impersonation_logs(support_ticket);
CREATE INDEX IF NOT EXISTS idx_imp_logs_started ON platform_impersonation_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_imp_logs_admin_started ON platform_impersonation_logs(super_admin_user_id, started_at DESC);

-- platform_audit_logs: append-only, partitioned monthly on created_at
CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    scope VARCHAR(16) NOT NULL DEFAULT 'PLATFORM',
    tenant_id UUID REFERENCES tenants(id),
    actor_user_id UUID NOT NULL REFERENCES users(id),
    actor_type VARCHAR(16) NOT NULL DEFAULT 'USER',
    actor_email_snapshot VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64),
    resource_id UUID,
    target_tenant_id UUID REFERENCES tenants(id),
    target_user_id UUID REFERENCES users(id),
    result VARCHAR(16) NOT NULL DEFAULT 'SUCCESS',
    correlation_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    prev_hash VARCHAR(64),
    entry_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at),
    CONSTRAINT chk_audit_scope CHECK (scope IN ('PLATFORM', 'TENANT')),
    CONSTRAINT chk_audit_scope_tenant CHECK (scope <> 'TENANT' OR tenant_id IS NOT NULL),
    CONSTRAINT chk_audit_result CHECK (result IN ('SUCCESS', 'DENIED', 'FAILED'))
) PARTITION BY RANGE (created_at);

-- Monthly partitions: current month + next 2 months, plus a safety-net default partition.
DO $$
DECLARE
    month_start DATE := date_trunc('month', (NOW() AT TIME ZONE 'UTC'))::date;
    i INT;
    partition_name TEXT;
    range_from TEXT;
    range_to TEXT;
BEGIN
    FOR i IN 0..2 LOOP
        partition_name := 'platform_audit_logs_' || to_char(month_start + make_interval(months => i), 'YYYY_MM');
        range_from := to_char(month_start + make_interval(months => i), 'YYYY-MM-DD') || ' 00:00:00+00';
        range_to := to_char(month_start + make_interval(months => i + 1), 'YYYY-MM-DD') || ' 00:00:00+00';
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF platform_audit_logs FOR VALUES FROM (%L) TO (%L)',
                partition_name, range_from, range_to);
        END IF;
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'platform_audit_logs_default') THEN
        EXECUTE 'CREATE TABLE platform_audit_logs_default PARTITION OF platform_audit_logs DEFAULT';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_created_brin ON platform_audit_logs USING BRIN (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_scope_tenant ON platform_audit_logs(scope, tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON platform_audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON platform_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target_tenant ON platform_audit_logs(target_tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_details_gin ON platform_audit_logs USING GIN (details jsonb_path_ops);

-- Immutable audit trail: UPDATE/DELETE are rejected (applies to every partition).
CREATE OR REPLACE FUNCTION trg_fn_prevent_audit_tamper()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CANNOT MODIFY OR DELETE AUDIT TRAIL LOG RECORD';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON platform_audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON platform_audit_logs
FOR EACH ROW EXECUTE FUNCTION trg_fn_prevent_audit_tamper();

-- ---------------------------------------------------------------------
-- 3. Organization layer (DES-02-DB section 3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    address TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_branch_tenant_code UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_dept_tenant_code UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_branch ON departments(branch_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_user_id);

CREATE TABLE IF NOT EXISTS user_department_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    direct_manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(128),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_dept UNIQUE(user_id, department_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_primary_dept ON user_department_memberships(user_id) WHERE is_primary;

CREATE INDEX IF NOT EXISTS idx_user_dept_user ON user_department_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dept_tenant ON user_department_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_dept_branch ON user_department_memberships(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_dept_dept ON user_department_memberships(department_id);
CREATE INDEX IF NOT EXISTS idx_user_dept_manager ON user_department_memberships(direct_manager_user_id);

CREATE TABLE IF NOT EXISTS user_branch_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_branch UNIQUE(user_id, branch_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_primary_branch ON user_branch_assignments(user_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS idx_user_branch_tenant ON user_branch_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_branch ON user_branch_assignments(branch_id);

-- Cross-tenant integrity (BUG-66): secondary keys targeted by composite FKs.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_branches_id_tenant' AND conrelid = 'branches'::regclass) THEN
        ALTER TABLE branches ADD CONSTRAINT uq_branches_id_tenant UNIQUE (id, tenant_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_departments_id_tenant' AND conrelid = 'departments'::regclass) THEN
        ALTER TABLE departments ADD CONSTRAINT uq_departments_id_tenant UNIQUE (id, tenant_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_membership_branch_tenant' AND conrelid = 'user_department_memberships'::regclass) THEN
        ALTER TABLE user_department_memberships
            ADD CONSTRAINT fk_membership_branch_tenant
                FOREIGN KEY (branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_membership_department_tenant' AND conrelid = 'user_department_memberships'::regclass) THEN
        ALTER TABLE user_department_memberships
            ADD CONSTRAINT fk_membership_department_tenant
                FOREIGN KEY (department_id, tenant_id) REFERENCES departments(id, tenant_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_branch_assignments_branch_tenant' AND conrelid = 'user_branch_assignments'::regclass) THEN
        ALTER TABLE user_branch_assignments
            ADD CONSTRAINT fk_user_branch_assignments_branch_tenant
                FOREIGN KEY (branch_id, tenant_id) REFERENCES branches(id, tenant_id) ON DELETE CASCADE;
    END IF;
END $$;

-- BR-RBAC-10: membership.branch_id must match departments.branch_id when the department is branch-bound.
CREATE OR REPLACE FUNCTION trg_fn_check_membership_branch_matches_dept()
RETURNS TRIGGER AS $$
DECLARE dept_branch UUID;
BEGIN
    SELECT branch_id INTO dept_branch FROM departments WHERE id = NEW.department_id;
    IF dept_branch IS NOT NULL AND dept_branch <> NEW.branch_id THEN
        RAISE EXCEPTION 'MEMBERSHIP_BRANCH_MISMATCH_DEPARTMENT';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_membership_branch_match ON user_department_memberships;
CREATE TRIGGER trg_membership_branch_match
BEFORE INSERT OR UPDATE ON user_department_memberships
FOR EACH ROW EXECUTE FUNCTION trg_fn_check_membership_branch_matches_dept();

-- ---------------------------------------------------------------------
-- 4. IAM layer (DES-02-DB section 4)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,
    domain VARCHAR(32) NOT NULL,
    resource VARCHAR(32) NOT NULL,
    action VARCHAR(32) NOT NULL,
    description_key VARCHAR(128) NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_domain ON permissions(domain);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_tenant_role_code UNIQUE(tenant_id, code)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_system_code ON roles(code) WHERE tenant_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY(user_id, tenant_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

CREATE TABLE IF NOT EXISTS role_data_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource VARCHAR(64) NOT NULL,
    create_scope VARCHAR(32) NOT NULL DEFAULT 'OWN_ONLY',
    read_scope VARCHAR(32) NOT NULL DEFAULT 'OWN_ONLY',
    update_scope VARCHAR(32) NOT NULL DEFAULT 'OWN_ONLY',
    delete_scope VARCHAR(32) NOT NULL DEFAULT 'NONE',
    export_scope VARCHAR(32) NOT NULL DEFAULT 'NONE',
    share_scope VARCHAR(32) NOT NULL DEFAULT 'NONE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_role_resource_policy UNIQUE(role_id, resource),
    CONSTRAINT chk_data_scopes CHECK (
        create_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        read_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        update_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        delete_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        export_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE') AND
        share_scope IN ('ALL', 'BRANCH', 'DEPARTMENT_AND_CHILDREN', 'DEPARTMENT', 'OWN_AND_SUBORDINATES', 'OWN_ONLY', 'NONE')
    )
);

CREATE INDEX IF NOT EXISTS idx_role_data_policies_tenant ON role_data_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_data_policies_role ON role_data_policies(role_id);
CREATE INDEX IF NOT EXISTS idx_role_data_policies_resource ON role_data_policies(resource);

-- Cross-tenant integrity for role-bound tables (BUG-66).
-- NOTE: global system roles have tenant_id = NULL, therefore a plain composite FK
-- (role_id, tenant_id) -> roles(id, tenant_id) would reject assigning them. The trigger
-- below enforces the exact same invariant (role belongs to the same tenant OR is a global
-- system role) which is the semantics required by BUG-66.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_roles_id_tenant' AND conrelid = 'roles'::regclass) THEN
        ALTER TABLE roles ADD CONSTRAINT uq_roles_id_tenant UNIQUE (id, tenant_id);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION trg_fn_assert_role_tenant_scope()
RETURNS TRIGGER AS $$
DECLARE role_tenant UUID;
BEGIN
    SELECT tenant_id INTO role_tenant FROM roles WHERE id = NEW.role_id;
    IF role_tenant IS NOT NULL AND role_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'ROLE_TENANT_MISMATCH: role % does not belong to tenant %', NEW.role_id, NEW.tenant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_roles_role_scope ON user_roles;
CREATE TRIGGER trg_user_roles_role_scope
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION trg_fn_assert_role_tenant_scope();

DROP TRIGGER IF EXISTS trg_role_data_policies_role_scope ON role_data_policies;
CREATE TRIGGER trg_role_data_policies_role_scope
BEFORE INSERT OR UPDATE ON role_data_policies
FOR EACH ROW EXECUTE FUNCTION trg_fn_assert_role_tenant_scope();

-- ---------------------------------------------------------------------
-- 5. Reference entity for the Data Permission Enforcement Engine (FEAT-17)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core_sample_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID,
    department_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    assignee_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_sample_tenant_branch ON core_sample_records(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_core_sample_tenant_dept ON core_sample_records(tenant_id, department_id);
CREATE INDEX IF NOT EXISTS idx_core_sample_tenant_created ON core_sample_records(tenant_id, created_by);
CREATE INDEX IF NOT EXISTS idx_core_sample_tenant_assignee ON core_sample_records(tenant_id, assignee_id);

-- ---------------------------------------------------------------------
-- 6. Seed: core permission catalog (TASK-268) - idempotent by code
-- ---------------------------------------------------------------------
INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
    ('core:user:read', 'core', 'user', 'read', 'PERM_CORE_USER_READ', TRUE),
    ('core:user:create', 'core', 'user', 'create', 'PERM_CORE_USER_CREATE', TRUE),
    ('core:user:update', 'core', 'user', 'update', 'PERM_CORE_USER_UPDATE', TRUE),
    ('core:user:delete', 'core', 'user', 'delete', 'PERM_CORE_USER_DELETE', TRUE),
    ('core:role:read', 'core', 'role', 'read', 'PERM_CORE_ROLE_READ', TRUE),
    ('core:role:manage', 'core', 'role', 'manage', 'PERM_CORE_ROLE_MANAGE', TRUE),
    ('core:permission:read', 'core', 'permission', 'read', 'PERM_CORE_PERMISSION_READ', TRUE),
    ('core:organization:read', 'core', 'organization', 'read', 'PERM_CORE_ORGANIZATION_READ', TRUE),
    ('core:organization:manage', 'core', 'organization', 'manage', 'PERM_CORE_ORGANIZATION_MANAGE', TRUE),
    ('core:branch:read', 'core', 'branch', 'read', 'PERM_CORE_BRANCH_READ', TRUE),
    ('core:branch:manage', 'core', 'branch', 'manage', 'PERM_CORE_BRANCH_MANAGE', TRUE),
    ('core:department:read', 'core', 'department', 'read', 'PERM_CORE_DEPARTMENT_READ', TRUE),
    ('core:department:manage', 'core', 'department', 'manage', 'PERM_CORE_DEPARTMENT_MANAGE', TRUE),
    ('core:membership:read', 'core', 'membership', 'read', 'PERM_CORE_MEMBERSHIP_READ', TRUE),
    ('core:membership:manage', 'core', 'membership', 'manage', 'PERM_CORE_MEMBERSHIP_MANAGE', TRUE),
    ('core:branch-assignment:read', 'core', 'branch-assignment', 'read', 'PERM_CORE_BRANCH_ASSIGNMENT_READ', TRUE),
    ('core:branch-assignment:manage', 'core', 'branch-assignment', 'manage', 'PERM_CORE_BRANCH_ASSIGNMENT_MANAGE', TRUE),
    ('core:audit:read', 'core', 'audit', 'read', 'PERM_CORE_AUDIT_READ', TRUE),
    ('core:sample-record:read', 'core', 'sample-record', 'read', 'PERM_CORE_SAMPLE_RECORD_READ', TRUE),
    ('core:sample-record:create', 'core', 'sample-record', 'create', 'PERM_CORE_SAMPLE_RECORD_CREATE', TRUE),
    ('core:sample-record:update', 'core', 'sample-record', 'update', 'PERM_CORE_SAMPLE_RECORD_UPDATE', TRUE),
    ('core:sample-record:delete', 'core', 'sample-record', 'delete', 'PERM_CORE_SAMPLE_RECORD_DELETE', TRUE),
    ('core:sample-record:export', 'core', 'sample-record', 'export', 'PERM_CORE_SAMPLE_RECORD_EXPORT', TRUE),
    ('core:sample-record:share', 'core', 'sample-record', 'share', 'PERM_CORE_SAMPLE_RECORD_SHARE', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 7. Seed: global system roles (tenant_id NULL, is_system TRUE)
-- ---------------------------------------------------------------------
INSERT INTO roles (tenant_id, code, name, description, is_system) VALUES
    (NULL, 'TENANT_OWNER', 'Tenant Owner', 'Full functional and data access within the tenant', TRUE),
    (NULL, 'TENANT_ADMIN', 'Tenant Administrator', 'Manages users, roles, organization and configuration', TRUE),
    (NULL, 'GENERAL_MANAGER', 'General Manager', 'Reads all resources, exports reports and audits administration', TRUE),
    (NULL, 'STAFF', 'Staff', 'Performs daily operations on assigned sample records', TRUE),
    (NULL, 'VIEWER', 'Viewer', 'Read-only access to tenant resources', TRUE)
ON CONFLICT (code) WHERE tenant_id IS NULL DO NOTHING;

-- ---------------------------------------------------------------------
-- 8. Seed: role_permissions allocation for the 5 system roles
--    - TENANT_OWNER / TENANT_ADMIN: all permissions
--    - GENERAL_MANAGER: every read + export permission (incl. audit:read, organization:read)
--    - STAFF: sample-record read/create/update + organization:read
--    - VIEWER: every read permission
-- ---------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL AND r.code = 'GENERAL_MANAGER' AND p.action IN ('read', 'export')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL AND r.code = 'STAFF'
  AND p.code IN ('core:sample-record:read', 'core:sample-record:create', 'core:sample-record:update', 'core:organization:read')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL AND r.code = 'VIEWER' AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 9. Row protection for impersonation logs (DELETE is never allowed for app role)
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'openerp_app') THEN
        EXECUTE 'REVOKE DELETE ON platform_impersonation_logs FROM openerp_app';
        EXECUTE 'REVOKE UPDATE, DELETE ON platform_audit_logs FROM openerp_app';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        EXECUTE 'REVOKE DELETE ON platform_impersonation_logs FROM app';
        EXECUTE 'REVOKE UPDATE, DELETE ON platform_audit_logs FROM app';
    END IF;
END $$;
