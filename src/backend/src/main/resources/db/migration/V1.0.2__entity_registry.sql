-- BUG-26: Core IAM Entity Registry (SYSTEM_BLUEPRINT section 5.1)
CREATE TABLE IF NOT EXISTS sys_entity_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    storage_type VARCHAR(20) NOT NULL,
    table_or_collection VARCHAR(100) NOT NULL,
    schema_definition JSONB NOT NULL,
    exported_relations JSONB,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_plugin_entity UNIQUE (plugin_id, entity_name)
);
