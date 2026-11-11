-- Sprint 09 / DES-DB-S09-001: Plugin attendance schema part 2
-- Covers requests, request types, leave types, leave ledger & balances,
-- monthly timesheets (4-step lifecycle), confirmations and export templates.

CREATE TABLE IF NOT EXISTS plg_attendance_request_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(128) NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    form_ref JSONB,
    workflow_definition_key VARCHAR(80),
    status_mapping JSONB,
    window_days INTEGER NOT NULL DEFAULT 30,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_req_type_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS plg_attendance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_type_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL,
    subject_employee_id UUID NOT NULL,
    submitted_by_user_id UUID NOT NULL,
    form_version INTEGER,
    response JSONB NOT NULL,
    status VARCHAR(16) NOT NULL,
    workflow_instance_id UUID,
    approval_mode VARCHAR(16) NOT NULL DEFAULT 'ENGINE',
    fallback_approver_employee_id UUID,
    fallback_comment TEXT,
    affected_window JSONB,
    mapping_status VARCHAR(16) NOT NULL DEFAULT 'NOT_APPLICABLE',
    mapping_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_request_code UNIQUE (tenant_id, code),
    CONSTRAINT ck_attendance_request_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT ck_attendance_approval_mode CHECK (approval_mode IN ('ENGINE', 'INTERNAL_FALLBACK')),
    CONSTRAINT ck_attendance_mapping_status CHECK (mapping_status IN ('NOT_APPLICABLE', 'PENDING', 'APPLIED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_requests_subject
    ON plg_attendance_requests (tenant_id, subject_employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_requests_status
    ON plg_attendance_requests (tenant_id, status);

CREATE TABLE IF NOT EXISTS plg_attendance_leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT TRUE,
    counts_as_work BOOLEAN NOT NULL DEFAULT FALSE,
    deduct_balance BOOLEAN NOT NULL DEFAULT TRUE,
    allow_negative BOOLEAN NOT NULL DEFAULT FALSE,
    carry_over_max_days INTEGER NOT NULL DEFAULT 0,
    validity_months INTEGER,
    default_annual_grant NUMERIC(5,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_leave_type_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS plg_attendance_leave_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    leave_type_id UUID NOT NULL,
    entry_type VARCHAR(16) NOT NULL,
    days NUMERIC(5,2) NOT NULL,
    valid_until DATE,
    source_request_id UUID,
    source VARCHAR(16) NOT NULL DEFAULT 'HR',
    note TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_attendance_ledger_entry CHECK (entry_type IN ('GRANT', 'USAGE', 'USAGE_REVERSAL', 'ADJUSTMENT', 'EXPIRY')),
    CONSTRAINT ck_attendance_ledger_source CHECK (source IN ('REQUEST', 'HR', 'JOB'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_leave_ledger_emp_type
    ON plg_attendance_leave_ledger (tenant_id, employee_id, leave_type_id);

CREATE TABLE IF NOT EXISTS plg_attendance_leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    leave_type_id UUID NOT NULL,
    granted NUMERIC(5,2) NOT NULL DEFAULT 0,
    used NUMERIC(5,2) NOT NULL DEFAULT 0,
    remaining NUMERIC(5,2) NOT NULL DEFAULT 0,
    expiring NUMERIC(5,2) NOT NULL DEFAULT 0,
    recomputed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_leave_balance UNIQUE (tenant_id, employee_id, leave_type_id)
);

CREATE TABLE IF NOT EXISTS plg_attendance_timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    scope_type VARCHAR(16) NOT NULL,
    scope_id UUID,
    wage_calc_mode VARCHAR(24) NOT NULL DEFAULT 'STANDARD_MINUS_UNPAID',
    step VARCHAR(16) NOT NULL DEFAULT 'S1_LOGS',
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    unlocked_by UUID,
    unlock_reason TEXT,
    snapshot JSONB,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_timesheet_period UNIQUE (tenant_id, scope_type, scope_id, period_year, period_month),
    CONSTRAINT ck_attendance_timesheet_scope CHECK (scope_type IN ('TENANT', 'BRANCH', 'DEPARTMENT')),
    CONSTRAINT ck_attendance_timesheet_wage CHECK (wage_calc_mode IN ('STANDARD_MINUS_UNPAID', 'ACTUAL_TOTAL')),
    CONSTRAINT ck_attendance_timesheet_step CHECK (step IN ('S1_LOGS', 'S2_SCHEDULE', 'S3_CALCULATE', 'S4_ADJUST', 'DONE'))
);

CREATE TABLE IF NOT EXISTS plg_attendance_timesheet_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    timesheet_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    comment TEXT,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acted_at TIMESTAMP WITH TIME ZONE,
    acted_by UUID,
    CONSTRAINT uq_attendance_confirmation UNIQUE (tenant_id, timesheet_id, employee_id),
    CONSTRAINT ck_attendance_confirmation_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_confirmation_ts_status
    ON plg_attendance_timesheet_confirmations (tenant_id, timesheet_id, status);

CREATE TABLE IF NOT EXISTS plg_attendance_export_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(128) NOT NULL,
    columns JSONB NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

