CREATE TABLE IF NOT EXISTS plg_organization_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    address TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_branch_code UNIQUE (tenant_id, code),
    CONSTRAINT ck_org_branch_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_branch_default
    ON plg_organization_branches (tenant_id)
    WHERE is_default;

CREATE INDEX IF NOT EXISTS idx_org_branch_tenant_status
    ON plg_organization_branches (tenant_id, status);

CREATE TABLE IF NOT EXISTS plg_organization_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    parent_id UUID,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    manager_user_id UUID,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_department_code UNIQUE (tenant_id, code),
    CONSTRAINT ck_org_department_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_org_department_tenant_branch
    ON plg_organization_departments (tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_org_department_tenant_parent
    ON plg_organization_departments (tenant_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_org_department_tenant_manager
    ON plg_organization_departments (tenant_id, manager_user_id);

CREATE TABLE IF NOT EXISTS plg_organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    department_id UUID NOT NULL,
    direct_manager_user_id UUID,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_membership_user_department_from UNIQUE (tenant_id, user_id, department_id, valid_from),
    CONSTRAINT ck_org_membership_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT ck_org_membership_valid_range CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_membership_primary
    ON plg_organization_memberships (tenant_id, user_id)
    WHERE is_primary AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_org_membership_tenant_user
    ON plg_organization_memberships (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_membership_tenant_branch
    ON plg_organization_memberships (tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_org_membership_tenant_department
    ON plg_organization_memberships (tenant_id, department_id);
CREATE INDEX IF NOT EXISTS idx_org_membership_tenant_manager
    ON plg_organization_memberships (tenant_id, direct_manager_user_id);

CREATE TABLE IF NOT EXISTS plg_organization_branch_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT uq_org_branch_access_from UNIQUE (tenant_id, user_id, branch_id, valid_from),
    CONSTRAINT ck_org_branch_access_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT ck_org_branch_access_valid_range CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_branch_access_primary
    ON plg_organization_branch_access (tenant_id, user_id)
    WHERE is_primary AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_org_branch_access_tenant_user
    ON plg_organization_branch_access (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_branch_access_tenant_branch
    ON plg_organization_branch_access (tenant_id, branch_id);

CREATE TABLE IF NOT EXISTS plg_organization_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_org_outbox_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_org_outbox_pending
    ON plg_organization_outbox (status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_org_outbox_tenant_created
    ON plg_organization_outbox (tenant_id, created_at);
