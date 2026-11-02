-- Sprint 09 / DES-DB-S09-001: plugin attendance schema (part 1 of the approved design).
-- Covers shifts, schedules, holidays, logs, daily records, OT windows, hanging checks,
-- devices, tenant settings, employee projection and the plugin outbox. Request forms,
-- leave ledger and timesheet tables ship with their own migrations (FEAT-44/45/46).

CREATE TABLE IF NOT EXISTS plg_attendance_shift_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    catalog_shift_id UUID,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_in_minutes INTEGER NOT NULL DEFAULT 0,
    grace_out_minutes INTEGER NOT NULL DEFAULT 0,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    ot_grace_minutes INTEGER NOT NULL DEFAULT 0,
    min_ot_minutes INTEGER NOT NULL DEFAULT 15,
    working_minutes INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_shift_code UNIQUE (tenant_id, code),
    CONSTRAINT ck_attendance_shift_minutes CHECK (working_minutes > 0)
);

CREATE TABLE IF NOT EXISTS plg_attendance_shift_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    scope_type VARCHAR(16) NOT NULL,
    scope_id UUID,
    name VARCHAR(128) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    week JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_attendance_template_scope CHECK (scope_type IN ('TENANT', 'BRANCH', 'DEPARTMENT'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_template_scope
    ON plg_attendance_shift_templates (tenant_id, scope_type, scope_id, effective_from);

CREATE TABLE IF NOT EXISTS plg_attendance_shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    work_date DATE NOT NULL,
    shift_definition_id UUID,
    source VARCHAR(16) NOT NULL DEFAULT 'HR',
    reason VARCHAR(255),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_assignment_day UNIQUE (tenant_id, employee_id, work_date),
    CONSTRAINT ck_attendance_assignment_source CHECK (source IN ('HR', 'SHIFT_SWAP'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_assignment_date
    ON plg_attendance_shift_assignments (tenant_id, work_date);

CREATE TABLE IF NOT EXISTS plg_attendance_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(128) NOT NULL,
    holiday_date DATE NOT NULL,
    recurring_annual BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_holiday_date UNIQUE (tenant_id, holiday_date)
);

CREATE TABLE IF NOT EXISTS plg_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    event_type VARCHAR(8) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    work_date DATE NOT NULL,
    source VARCHAR(16) NOT NULL,
    device_id UUID,
    meta JSONB,
    deleted_by UUID,
    deleted_reason TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_attendance_log_event CHECK (event_type IN ('IN', 'OUT')),
    CONSTRAINT ck_attendance_log_source CHECK (source IN ('WEB', 'MOBILE', 'KIOSK', 'IMPORT', 'PUSH', 'MANUAL'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee_time
    ON plg_attendance_logs (tenant_id, employee_id, occurred_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_logs_machine
    ON plg_attendance_logs (tenant_id, source, device_id, occurred_at, employee_id)
    WHERE source IN ('KIOSK', 'PUSH', 'IMPORT') AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS plg_attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    work_date DATE NOT NULL,
    shift_definition_id UUID,
    shift_name_snapshot VARCHAR(128),
    status VARCHAR(16) NOT NULL,
    effective_in TIMESTAMP WITH TIME ZONE,
    effective_out TIMESTAMP WITH TIME ZONE,
    worked_minutes INTEGER NOT NULL DEFAULT 0,
    late_minutes INTEGER NOT NULL DEFAULT 0,
    early_leave_minutes INTEGER NOT NULL DEFAULT 0,
    ot_minutes INTEGER NOT NULL DEFAULT 0,
    calc_version INTEGER NOT NULL DEFAULT 1,
    is_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    override_by UUID,
    needs_review BOOLEAN NOT NULL DEFAULT FALSE,
    review_note TEXT,
    timesheet_id UUID,
    lock_version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_record_day UNIQUE (tenant_id, employee_id, work_date, shift_definition_id),
    CONSTRAINT ck_attendance_record_status CHECK (status IN
        ('PRESENT', 'ABSENT', 'HALF_DAY', 'WFH', 'ON_LEAVE', 'BUSINESS_TRIP'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_employee
    ON plg_attendance_records (tenant_id, employee_id, work_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_records_day_status
    ON plg_attendance_records (tenant_id, work_date, status);

CREATE INDEX IF NOT EXISTS idx_attendance_records_review
    ON plg_attendance_records (tenant_id, needs_review) WHERE needs_review;

CREATE TABLE IF NOT EXISTS plg_attendance_ot_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    request_id UUID,
    work_date DATE NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_attendance_ot_status CHECK (status IN ('ACTIVE', 'CANCELLED')),
    CONSTRAINT ck_attendance_ot_window CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_attendance_ot_employee_date
    ON plg_attendance_ot_windows (tenant_id, employee_id, work_date);

CREATE TABLE IF NOT EXISTS plg_attendance_hanging_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    log_id UUID NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    handled_at TIMESTAMP WITH TIME ZONE,
    handled_by UUID,
    CONSTRAINT uq_attendance_hanging_log UNIQUE (tenant_id, log_id)
);

CREATE TABLE IF NOT EXISTS plg_attendance_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(128) NOT NULL,
    device_type VARCHAR(16) NOT NULL,
    branch_id UUID,
    device_code VARCHAR(64) NOT NULL,
    pin_hash VARCHAR(128),
    ingest_secret_hash VARCHAR(128),
    secret_rotated_at TIMESTAMP WITH TIME ZONE,
    locked_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_device_code UNIQUE (tenant_id, device_code),
    CONSTRAINT ck_attendance_device_type CHECK (device_type IN ('KIOSK', 'MIDDLEWARE'))
);

CREATE TABLE IF NOT EXISTS plg_attendance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    hanging_threshold_hours INTEGER NOT NULL DEFAULT 16,
    geofence_radius_m INTEGER NOT NULL DEFAULT 200,
    default_shift_definition_id UUID,
    mobile_require_gps BOOLEAN NOT NULL DEFAULT TRUE,
    kiosk_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    work_week JSONB,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_settings_tenant UNIQUE (tenant_id)
);

CREATE TABLE IF NOT EXISTS plg_attendance_employee_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_code VARCHAR(32) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_id UUID,
    primary_branch_id UUID,
    primary_department_id UUID,
    manager_employee_id UUID,
    employment_status VARCHAR(16) NOT NULL,
    hire_date DATE,
    exit_date DATE,
    synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_ref_employee UNIQUE (tenant_id, employee_id)
);

CREATE TABLE IF NOT EXISTS plg_attendance_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_attendance_outbox_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_outbox_pending
    ON plg_attendance_outbox (created_at) WHERE status = 'PENDING';
