-- FEAT-31: type-level parent/child relations, many relation types, many parents.
-- Backfills the legacy allowed_parent_types array into explicit relation rows.

CREATE TABLE IF NOT EXISTS catalog_type_relations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID,
    parent_type_id UUID NOT NULL REFERENCES catalog_types(id) ON DELETE CASCADE,
    child_type_id  UUID NOT NULL REFERENCES catalog_types(id) ON DELETE CASCADE,
    relation_type  VARCHAR(32) NOT NULL DEFAULT 'HIERARCHY',
    sort_order     INT NOT NULL DEFAULT 0,
    status         VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_catalog_type_relation_self CHECK (parent_type_id <> child_type_id),
    CONSTRAINT chk_catalog_type_relation_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_catalog_type_relation UNIQUE NULLS NOT DISTINCT
        (tenant_id, parent_type_id, child_type_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_catalog_type_rel_parent
    ON catalog_type_relations (tenant_id, parent_type_id);
CREATE INDEX IF NOT EXISTS idx_catalog_type_rel_child
    ON catalog_type_relations (tenant_id, child_type_id);

-- One relation row per allowed parent code; the tenant row wins over the system row.
INSERT INTO catalog_type_relations (tenant_id, parent_type_id, child_type_id, relation_type)
SELECT DISTINCT ON (c.tenant_id, c.id, p.code)
       c.tenant_id,
       p.id,
       c.id,
       COALESCE(c.allowed_relations[1], 'HIERARCHY')
FROM catalog_types c
JOIN catalog_types p ON p.code = ANY (c.allowed_parent_types)
WHERE p.tenant_id IS NULL OR p.tenant_id = c.tenant_id
ORDER BY c.tenant_id, c.id, p.code, (p.tenant_id IS NULL) ASC
ON CONFLICT DO NOTHING;
