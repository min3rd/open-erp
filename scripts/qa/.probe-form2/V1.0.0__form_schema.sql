CREATE TABLE IF NOT EXISTS plg_form_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    slug VARCHAR(64) NOT NULL,
    title_text VARCHAR(300) NOT NULL,
    description TEXT,
    document JSONB NOT NULL,
    entity_mapping JSONB,
    publish_status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    captcha VARCHAR(24) NOT NULL DEFAULT 'none',
    close_at TIMESTAMP WITH TIME ZONE,
    response_limit INTEGER,
    accept_responses BOOLEAN NOT NULL DEFAULT TRUE,
    latest_version INTEGER NOT NULL DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_form_definitions_slug UNIQUE (tenant_id, slug),
    CONSTRAINT ck_form_publish_status CHECK (publish_status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
    CONSTRAINT ck_form_captcha CHECK (captcha IN ('none', 'recaptcha-v3'))
);

CREATE INDEX IF NOT EXISTS idx_form_definitions_status
    ON plg_form_definitions (tenant_id, publish_status);

CREATE TABLE IF NOT EXISTS plg_form_definitions_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    definition_id UUID NOT NULL,
    version INTEGER NOT NULL,
    document JSONB NOT NULL,
    entity_mapping JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_form_definition_version UNIQUE (tenant_id, definition_id, version)
);

CREATE TABLE IF NOT EXISTS plg_form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_id UUID NOT NULL,
    form_version INTEGER NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    responder_email VARCHAR(320),
    submitted_by_user_id UUID,
    entity_write_status VARCHAR(16) NOT NULL DEFAULT 'SKIPPED',
    entity_write_error TEXT,
    workflow_instance_id UUID,
    ip_hash VARCHAR(64),
    idempotency_key VARCHAR(80) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_form_entity_write_status CHECK (entity_write_status IN ('SKIPPED', 'OK', 'FAILED')),
    CONSTRAINT uq_form_response_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_form_responses_form_submitted
    ON plg_form_responses (tenant_id, form_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS plg_form_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_id UUID NOT NULL,
    response_id UUID,
    storage_key VARCHAR(400) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120),
    size_bytes BIGINT,
    scan_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    scan_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_form_file_scan_status CHECK (scan_status IN ('PENDING', 'CLEAN', 'INFECTED', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_form_files_response
    ON plg_form_files (tenant_id, response_id);

CREATE TABLE IF NOT EXISTS plg_form_public_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_id UUID NOT NULL,
    event VARCHAR(24) NOT NULL,
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_form_public_event CHECK (event IN ('VIEW', 'SUBMIT', 'REJECT_RATELIMIT', 'REJECT_CAPTCHA'))
);

CREATE INDEX IF NOT EXISTS idx_form_public_events_form
    ON plg_form_public_events (tenant_id, form_id, created_at DESC);
