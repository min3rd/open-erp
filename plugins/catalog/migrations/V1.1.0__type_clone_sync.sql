-- FEAT-32: tenant clone of a system type cluster + sync mapping.
-- system_*_id points a tenant row at the system row it was cloned from.

ALTER TABLE catalog_types          ADD COLUMN IF NOT EXISTS system_type_id UUID;
ALTER TABLE catalog_items          ADD COLUMN IF NOT EXISTS system_item_id UUID;
ALTER TABLE catalog_item_edges     ADD COLUMN IF NOT EXISTS system_edge_id UUID;
ALTER TABLE catalog_type_relations ADD COLUMN IF NOT EXISTS system_relation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_type_system_type
    ON catalog_types (tenant_id, system_type_id) WHERE system_type_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_item_system_item
    ON catalog_items (tenant_id, system_item_id) WHERE system_item_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_edge_system_edge
    ON catalog_item_edges (tenant_id, system_edge_id) WHERE system_edge_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_type_relation_system
    ON catalog_type_relations (tenant_id, system_relation_id) WHERE system_relation_id IS NOT NULL;
