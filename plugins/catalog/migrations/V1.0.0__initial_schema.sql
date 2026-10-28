-- Catalog plugin schema (runs inside DB_SCHEMA = tenant_<short>_catalog).
-- No FK to core tables: tenant_id is a soft discriminator (NULL = system row),
-- role_code references core roles by code. ADR-S05-001 A4/A5/A13.
-- Platform prerequisite: btree_gist + pg_trgm are installed by the core
-- migration (V4/V5) in public. The tenant plugin role has no CREATE EXTENSION
-- privilege and must not need it.

CREATE TABLE IF NOT EXISTS catalog_types (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID,
    code                 VARCHAR(64)  NOT NULL,
    name_key             VARCHAR(128) NOT NULL,
    description_key      VARCHAR(128),
    hierarchy_mode       VARCHAR(16)  NOT NULL DEFAULT 'TREE',
    allowed_relations    VARCHAR(32)[] NOT NULL DEFAULT '{HIERARCHY}',
    allowed_parent_types VARCHAR(64)[],
    max_depth            SMALLINT,
    min_parents          SMALLINT     NOT NULL DEFAULT 0,
    allow_free_text      BOOLEAN      NOT NULL DEFAULT FALSE,
    versioned            BOOLEAN      NOT NULL DEFAULT TRUE,
    effective_dated      BOOLEAN      NOT NULL DEFAULT TRUE,
    attributes_schema    JSONB,
    status               VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_catalog_type_mode CHECK (hierarchy_mode IN ('TREE', 'DAG', 'FLAT')),
    CONSTRAINT chk_catalog_type_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_catalog_type_code UNIQUE NULLS NOT DISTINCT (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS catalog_items (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID,
    type_id            UUID NOT NULL REFERENCES catalog_types(id) ON DELETE RESTRICT,
    version_group_id   UUID NOT NULL,
    version            INT  NOT NULL DEFAULT 1,
    code               VARCHAR(64)  NOT NULL,
    name               VARCHAR(255) NOT NULL,
    name_en            VARCHAR(255),
    description        TEXT,
    attributes         JSONB,
    sort_order         INT  NOT NULL DEFAULT 0,
    status             VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    valid_from         TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to           TIMESTAMPTZ,
    supersedes_item_id UUID REFERENCES catalog_items(id),
    created_by         UUID,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by         UUID,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_catalog_item_window CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT uq_catalog_item_version UNIQUE (tenant_id, type_id, code, version),
    CONSTRAINT ex_catalog_item_window EXCLUDE USING gist (
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
        type_id WITH =,
        code WITH =,
        tstzrange(valid_from, valid_to) WITH &&
    )
);

CREATE TABLE IF NOT EXISTS catalog_item_edges (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID,
    parent_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
    child_item_id  UUID NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
    relation_type  VARCHAR(32) NOT NULL DEFAULT 'HIERARCHY',
    sort_order     INT NOT NULL DEFAULT 0,
    status         VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    valid_from     TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to       TIMESTAMPTZ,
    created_by     UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_catalog_edge_self CHECK (parent_item_id <> child_item_id),
    CONSTRAINT chk_catalog_edge_window CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT ex_catalog_edge_window EXCLUDE USING gist (
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
        parent_item_id WITH =,
        child_item_id WITH =,
        relation_type WITH =,
        tstzrange(valid_from, valid_to) WITH &&
    )
);

CREATE TABLE IF NOT EXISTS catalog_type_grants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL,
    type_id    UUID NOT NULL REFERENCES catalog_types(id) ON DELETE CASCADE,
    role_code  VARCHAR(80) NOT NULL,
    can_read   BOOLEAN NOT NULL DEFAULT TRUE,
    can_write  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_catalog_type_grant UNIQUE (tenant_id, type_id, role_code)
);

CREATE TABLE IF NOT EXISTS catalog_audit (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID,
    actor_user_id UUID,
    action        VARCHAR(80) NOT NULL,
    resource_type VARCHAR(80),
    resource_id   UUID,
    result        VARCHAR(16) NOT NULL DEFAULT 'SUCCESS',
    details       JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_edges_parent ON catalog_item_edges (parent_item_id) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_edges_child  ON catalog_item_edges (child_item_id)  WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_edges_tenant ON catalog_item_edges (tenant_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_catalog_items_lookup ON catalog_items (tenant_id, type_id, code) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_items_group  ON catalog_items (version_group_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_items_name_trgm ON catalog_items USING gin (name public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_catalog_types_tenant ON catalog_types (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_catalog_audit_tenant ON catalog_audit (tenant_id, created_at DESC);

-- System types live in every schema (tenant_id NULL); the fan-out copies them.
INSERT INTO catalog_types (tenant_id, code, name_key, hierarchy_mode, allowed_relations, allowed_parent_types, max_depth, allow_free_text)
VALUES
    (NULL, 'PROVINCE', 'CATALOG_TYPE_PROVINCE', 'TREE', '{HIERARCHY}', NULL, NULL, FALSE),
    (NULL, 'DISTRICT', 'CATALOG_TYPE_DISTRICT', 'TREE', '{HIERARCHY}', '{PROVINCE}', NULL, FALSE),
    (NULL, 'COMMUNE',  'CATALOG_TYPE_COMMUNE',  'TREE', '{HIERARCHY}', '{PROVINCE,DISTRICT}', NULL, FALSE),
    (NULL, 'INDUSTRY', 'CATALOG_TYPE_INDUSTRY', 'DAG',  '{CLASSIFICATION}', NULL, NULL, FALSE),
    (NULL, 'JOB',      'CATALOG_TYPE_JOB',      'DAG',  '{CLASSIFICATION,ALLOCATION}', '{INDUSTRY}', NULL, TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;
