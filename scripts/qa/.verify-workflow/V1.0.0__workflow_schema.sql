CREATE TABLE IF NOT EXISTS plg_workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    key VARCHAR(80) NOT NULL,
    version INTEGER NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    document JSONB NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_workflow_definition_version UNIQUE (tenant_id, key, version),
    CONSTRAINT ck_workflow_definition_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_key_status
    ON plg_workflow_definitions (tenant_id, key, status);

CREATE TABLE IF NOT EXISTS plg_workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    definition_id UUID NOT NULL,
    definition_version INTEGER NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'RUNNING',
    outcome VARCHAR(24),
    trigger_type VARCHAR(16) NOT NULL,
    source_ref JSONB,
    context JSONB,
    idempotency_key VARCHAR(120) NOT NULL,
    initiated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_workflow_instance_status CHECK (status IN ('RUNNING', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT ck_workflow_instance_trigger CHECK (trigger_type IN ('MANUAL', 'API', 'EVENT', 'WEBHOOK', 'BOOTSTRAP')),
    CONSTRAINT uq_workflow_instance_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_status
    ON plg_workflow_instances (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_source
    ON plg_workflow_instances (tenant_id, ((source_ref->>'aggregate_id')));

CREATE TABLE IF NOT EXISTS plg_workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    instance_id UUID NOT NULL,
    node_id VARCHAR(80) NOT NULL,
    node_type VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    approval_mode VARCHAR(16) NOT NULL DEFAULT 'ANY_ONE',
    vote_ratio NUMERIC(3, 2),
    assignees JSONB NOT NULL DEFAULT '[]'::jsonb,
    candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
    claimed_by UUID,
    action_votes JSONB NOT NULL DEFAULT '[]'::jsonb,
    due_at TIMESTAMP WITH TIME ZONE,
    remind_before_hours INTEGER,
    reminder_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    overdue_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_workflow_task_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'RETURNED', 'SKIPPED', 'CANCELLED')),
    CONSTRAINT ck_workflow_task_mode CHECK (approval_mode IN ('ANY_ONE', 'ALL_APPROVE', 'VOTE_RATIO'))
);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_inbox
    ON plg_workflow_tasks (tenant_id, status, due_at);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_instance
    ON plg_workflow_tasks (tenant_id, instance_id);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_candidates
    ON plg_workflow_tasks USING GIN (candidates);

CREATE TABLE IF NOT EXISTS plg_workflow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    instance_id UUID NOT NULL,
    task_id UUID,
    event VARCHAR(32) NOT NULL,
    actor_user_id UUID,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_instance
    ON plg_workflow_events (tenant_id, instance_id, created_at);

CREATE TABLE IF NOT EXISTS plg_workflow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    definition_id UUID NOT NULL,
    source_plugin VARCHAR(40) NOT NULL DEFAULT '*',
    entity VARCHAR(80) NOT NULL DEFAULT '*',
    event_type VARCHAR(40) NOT NULL,
    filter JSONB,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_triggers_lookup
    ON plg_workflow_triggers (tenant_id, source_plugin, entity, event_type);

CREATE TABLE IF NOT EXISTS plg_workflow_webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    path_token VARCHAR(48) NOT NULL,
    secret_hash VARCHAR(128) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workflow_webhook_path UNIQUE (path_token)
);
