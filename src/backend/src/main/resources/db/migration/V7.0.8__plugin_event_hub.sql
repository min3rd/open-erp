-- Sprint 08 / ADR-S08-002: Plugin Event Hub - cross-plugin event fan-out.
-- Plugins publish (idempotent); the relay matches the event against the
-- event_subscriptions declared in each installed plugin version manifest and
-- delivers via the runtime gateway. Deliveries keep retry state so a down
-- plugin cannot block other subscribers.

CREATE TABLE IF NOT EXISTS plugin_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    source_plugin VARCHAR(40) NOT NULL,
    entity VARCHAR(80),
    event_type VARCHAR(80) NOT NULL,
    aggregate_id VARCHAR(80),
    payload JSONB,
    idempotency_key VARCHAR(120) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_plugin_events_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_plugin_events_pending
    ON plugin_events (created_at)
    WHERE processed_at IS NULL;

CREATE TABLE IF NOT EXISTS plugin_event_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES plugin_events(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    target_plugin VARCHAR(40) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_plugin_event_delivery UNIQUE (event_id, target_plugin),
    CONSTRAINT ck_plugin_event_delivery_status CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_plugin_event_deliveries_due
    ON plugin_event_deliveries (next_retry_at)
    WHERE status = 'PENDING';

-- ADR-S08-003: public (anonymous) fill sessions are auditable short-lived
-- PLUGIN_RUNTIME tokens bound to one tenant + plugin with empty permissions.
CREATE TABLE IF NOT EXISTS plugin_public_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    plugin_key VARCHAR(40) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugin_public_sessions_expiry
    ON plugin_public_sessions (plugin_key, expires_at);
