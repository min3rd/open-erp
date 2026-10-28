-- V5.1.0: Plugin Data Gateway idempotency for WRITE/ExecuteBatch.
-- Core stores the response in the same transaction as the data mutation so a
-- retry with the same idempotency key never re-applies the write.
CREATE TABLE IF NOT EXISTS plugin_data_idempotency (
    plugin_key   VARCHAR(100) NOT NULL,
    tenant_id    UUID NOT NULL,
    idem_key     VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_json JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (plugin_key, tenant_id, idem_key)
);

CREATE INDEX IF NOT EXISTS idx_plugin_data_idempotency_created
    ON plugin_data_idempotency (created_at);
