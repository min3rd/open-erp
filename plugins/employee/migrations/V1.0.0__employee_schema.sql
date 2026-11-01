-- Employee plugin schema per DES-DB-S07-001.
-- Implementation tables use the plg_employee_ prefix; every row is tenant-scoped.
-- Overlap guards require btree_gist for scalar equality columns inside GiST.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS plg_employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_code VARCHAR(32) NOT NULL,
    user_id UUID,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    employee_type VARCHAR(32) NOT NULL DEFAULT 'EMPLOYEE',
    full_name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(16),
    nationality VARCHAR(64),
    marital_status VARCHAR(32),
    national_id VARCHAR(32),
    national_id_issue_date DATE,
    national_id_issue_place VARCHAR(255),
    tax_code VARCHAR(32),
    social_insurance_no VARCHAR(32),
    health_insurance_no VARCHAR(32),
    personal_email VARCHAR(255),
    work_email VARCHAR(255),
    phone VARCHAR(32),
    current_address TEXT,
    permanent_address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(64),
    emergency_contact_phone VARCHAR(32),
    education_level VARCHAR(64),
    school VARCHAR(255),
    major VARCHAR(255),
    graduation_year INTEGER,
    notes TEXT,
    scope_sync_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_employee_profile_code UNIQUE (tenant_id, employee_code),
    CONSTRAINT ck_employee_profile_status CHECK (
        status IN ('DRAFT', 'PROBATION', 'ACTIVE', 'SUSPENDED', 'LEFT', 'RETIRED')
    ),
    CONSTRAINT ck_employee_profile_type CHECK (
        employee_type IN ('EMPLOYEE', 'WORKER', 'INTERN', 'CONTRACTOR', 'FREELANCER')
    ),
    CONSTRAINT ck_employee_profile_scope_sync CHECK (
        scope_sync_status IN ('PENDING', 'SYNCED', 'FAILED', 'NOT_APPLICABLE')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_profile_user
    ON plg_employee_profiles (tenant_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employee_profile_tenant_status
    ON plg_employee_profiles (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_profile_tenant_name
    ON plg_employee_profiles (tenant_id, full_name);
CREATE INDEX IF NOT EXISTS idx_employee_profile_tenant_work_email
    ON plg_employee_profiles (tenant_id, work_email);

CREATE TABLE IF NOT EXISTS plg_employee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    department_id UUID NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    job_title_catalog_id UUID,
    manager_employee_id UUID,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_assignment_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT fk_employee_assignment_manager FOREIGN KEY (manager_employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT ck_employee_assignment_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT ck_employee_assignment_range CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT ex_employee_assignment_period EXCLUDE USING gist (
        tenant_id WITH =,
        employee_id WITH =,
        daterange(valid_from, COALESCE(valid_to, 'infinity'::date), '[]') WITH &&
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_primary_assignment
    ON plg_employee_assignments (tenant_id, employee_id)
    WHERE is_primary AND status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_employee_assignment_tenant_branch
    ON plg_employee_assignments (tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignment_tenant_department
    ON plg_employee_assignments (tenant_id, department_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignment_tenant_manager
    ON plg_employee_assignments (tenant_id, manager_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignment_tenant_employee
    ON plg_employee_assignments (tenant_id, employee_id);

CREATE TABLE IF NOT EXISTS plg_employee_reporting_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    manager_employee_id UUID NOT NULL,
    relationship_type VARCHAR(16) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_reporting_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT fk_employee_reporting_manager FOREIGN KEY (manager_employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT ck_employee_reporting_self CHECK (employee_id <> manager_employee_id),
    CONSTRAINT ck_employee_reporting_type CHECK (relationship_type IN ('PRIMARY', 'DOTTED', 'MATRIX')),
    CONSTRAINT ck_employee_reporting_range CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT uq_employee_reporting_edge UNIQUE (
        tenant_id, employee_id, manager_employee_id, relationship_type, valid_from
    ),
    CONSTRAINT ex_employee_reporting_period EXCLUDE USING gist (
        tenant_id WITH =,
        employee_id WITH =,
        manager_employee_id WITH =,
        relationship_type WITH =,
        daterange(valid_from, COALESCE(valid_to, 'infinity'::date), '[]') WITH &&
    )
);

CREATE INDEX IF NOT EXISTS idx_employee_reporting_tenant_manager
    ON plg_employee_reporting_relationships (tenant_id, manager_employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_reporting_tenant_type
    ON plg_employee_reporting_relationships (tenant_id, relationship_type);

CREATE TABLE IF NOT EXISTS plg_employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    document_type VARCHAR(64) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    storage_key TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(64),
    scan_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    uploaded_by UUID,
    upload_source VARCHAR(16) NOT NULL DEFAULT 'HR',
    retention_until DATE,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_document_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT uq_employee_document_version UNIQUE (tenant_id, employee_id, document_type, version),
    CONSTRAINT ck_employee_document_scan CHECK (scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'FAILED')),
    CONSTRAINT ck_employee_document_source CHECK (upload_source IN ('HR', 'EMPLOYEE')),
    CONSTRAINT ck_employee_document_status CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    CONSTRAINT ck_employee_document_version CHECK (version > 0),
    CONSTRAINT ck_employee_document_size CHECK (size_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_employee_document_tenant_employee
    ON plg_employee_documents (tenant_id, employee_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_document_tenant_scan
    ON plg_employee_documents (tenant_id, scan_status);

CREATE TABLE IF NOT EXISTS plg_employee_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    contract_type VARCHAR(64) NOT NULL,
    contract_no VARCHAR(64) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    document_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_contract_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT fk_employee_contract_document FOREIGN KEY (document_id)
        REFERENCES plg_employee_documents (id),
    CONSTRAINT uq_employee_contract_no UNIQUE (tenant_id, contract_no),
    CONSTRAINT ck_employee_contract_range CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_contract_tenant_employee
    ON plg_employee_contracts (tenant_id, employee_id, start_date);

CREATE TABLE IF NOT EXISTS plg_employee_job_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    change_type VARCHAR(32) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    old_values JSONB,
    new_values JSONB,
    actor_user_id UUID,
    source VARCHAR(16) NOT NULL DEFAULT 'SYSTEM',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_history_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT ck_employee_history_type CHECK (change_type IN (
        'CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNMENT_CHANGED', 'CONTRACT_CHANGED',
        'LINKED_USER', 'UNLINKED_USER', 'EXITED', 'REHIRED', 'DOCUMENT'
    )),
    CONSTRAINT ck_employee_history_source CHECK (source IN ('ADMIN', 'SELF_SERVICE', 'IMPORT', 'SYSTEM'))
);

CREATE INDEX IF NOT EXISTS idx_employee_history_tenant_employee
    ON plg_employee_job_history (tenant_id, employee_id, effective_date DESC);

CREATE TABLE IF NOT EXISTS plg_employee_field_config (
    tenant_id UUID NOT NULL,
    field_key VARCHAR(64) NOT NULL,
    editable_by_employee BOOLEAN NOT NULL DEFAULT FALSE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, field_key)
);

CREATE TABLE IF NOT EXISTS plg_employee_approval_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    scope_type VARCHAR(16) NOT NULL,
    scope_id UUID,
    field_group VARCHAR(64) NOT NULL,
    step_no INTEGER NOT NULL,
    approver_type VARCHAR(16) NOT NULL,
    approver_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_employee_approval_scope UNIQUE (
        tenant_id, scope_type, scope_id, field_group, step_no
    ),
    CONSTRAINT ck_employee_approval_scope CHECK (scope_type IN ('TENANT', 'BRANCH', 'DEPARTMENT')),
    CONSTRAINT ck_employee_approval_type CHECK (approver_type IN ('ROLE', 'USER', 'MANAGER')),
    CONSTRAINT ck_employee_approval_step CHECK (step_no > 0)
);

CREATE INDEX IF NOT EXISTS idx_employee_approval_tenant_group
    ON plg_employee_approval_config (tenant_id, field_group);

CREATE TABLE IF NOT EXISTS plg_employee_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    requested_by_user_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    current_step INTEGER NOT NULL DEFAULT 1,
    changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_change_request_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT ck_employee_change_request_status CHECK (
        status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'CONFLICT', 'EXPIRED')
    ),
    CONSTRAINT ck_employee_change_request_step CHECK (current_step > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_open_request
    ON plg_employee_change_requests (tenant_id, employee_id)
    WHERE status IN ('PENDING', 'IN_REVIEW', 'CONFLICT');

CREATE INDEX IF NOT EXISTS idx_employee_change_request_tenant_status
    ON plg_employee_change_requests (tenant_id, status, submitted_at);

CREATE TABLE IF NOT EXISTS plg_employee_change_request_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL,
    step_no INTEGER NOT NULL,
    approver_type VARCHAR(16) NOT NULL,
    approver_id UUID,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    acted_by UUID,
    acted_at TIMESTAMP WITH TIME ZONE,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_change_step_request FOREIGN KEY (request_id)
        REFERENCES plg_employee_change_requests (id),
    CONSTRAINT uq_employee_change_step UNIQUE (request_id, step_no),
    CONSTRAINT ck_employee_change_step_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED')),
    CONSTRAINT ck_employee_change_step_no CHECK (step_no > 0)
);

CREATE INDEX IF NOT EXISTS idx_employee_change_step_tenant_approver
    ON plg_employee_change_request_steps (tenant_id, approver_id, status);

CREATE TABLE IF NOT EXISTS plg_employee_onboarding_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_onboarding_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT uq_employee_onboarding_token UNIQUE (token_hash),
    CONSTRAINT ck_employee_onboarding_status CHECK (
        status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'EXPIRED', 'REVOKED')
    )
);

CREATE INDEX IF NOT EXISTS idx_employee_onboarding_tenant_email
    ON plg_employee_onboarding_invites (tenant_id, email, status);

CREATE TABLE IF NOT EXISTS plg_employee_update_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    filter JSONB NOT NULL DEFAULT '{}'::jsonb,
    deadline DATE,
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_employee_campaign_status CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED'))
);

CREATE TABLE IF NOT EXISTS plg_employee_update_campaign_recipients (
    tenant_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (campaign_id, employee_id),
    CONSTRAINT fk_employee_campaign_recipient_campaign FOREIGN KEY (campaign_id)
        REFERENCES plg_employee_update_campaigns (id),
    CONSTRAINT fk_employee_campaign_recipient_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT ck_employee_campaign_recipient_status CHECK (status IN ('PENDING', 'COMPLETED', 'SKIPPED'))
);

CREATE INDEX IF NOT EXISTS idx_employee_campaign_recipient_tenant
    ON plg_employee_update_campaign_recipients (tenant_id, status);

CREATE TABLE IF NOT EXISTS plg_employee_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_consent_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT uq_employee_consent UNIQUE (tenant_id, employee_id, purpose),
    CONSTRAINT ck_employee_consent_status CHECK (status IN ('GRANTED', 'REVOKED', 'PENDING'))
);

CREATE TABLE IF NOT EXISTS plg_employee_privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    subject_user_id UUID NOT NULL,
    employee_id UUID,
    request_type VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'RECEIVED',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    due_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employee_privacy_employee FOREIGN KEY (employee_id)
        REFERENCES plg_employee_profiles (id),
    CONSTRAINT ck_employee_privacy_type CHECK (
        request_type IN ('ACCESS', 'EXPORT', 'DELETE', 'RECTIFY', 'RESTRICT')
    ),
    CONSTRAINT ck_employee_privacy_status CHECK (
        status IN ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')
    )
);

CREATE INDEX IF NOT EXISTS idx_employee_privacy_tenant_status
    ON plg_employee_privacy_requests (tenant_id, status, due_at);

CREATE TABLE IF NOT EXISTS plg_employee_outbox (
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
    CONSTRAINT ck_employee_outbox_event CHECK (
        event_type IN ('SCOPE_UPSERT', 'SCOPE_REMOVE', 'NOTIFICATION', 'DOCUMENT_SCAN')
    ),
    CONSTRAINT ck_employee_outbox_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_employee_outbox_pending
    ON plg_employee_outbox (status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_employee_outbox_tenant_created
    ON plg_employee_outbox (tenant_id, created_at);
