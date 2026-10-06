-- =====================================================================
-- V4.0.0: Sprint 05 - Catalog core plugin schema, seed and tenant backfill
-- DES-DB-S05-001 / SOL-S05-001 (D1-D14) / TASK-375 / TASK-376
-- PostgreSQL 16+, schema public. All statements are idempotent.
--
-- Deviations from DES-DB-S05-001 (reported in the task hand-off, schema is
-- truth for the platform tables):
--   * chk_catalog_type_mode accepts FLAT in addition to TREE/DAG so the Java
--     enum CatalogHierarchyMode (TREE/DAG/FLAT) stays in sync with the DB.
--   * plugin_catalog.chk_plugin_visibility (V3.0.0, Sprint 03 Q4) forbids
--     is_core = TRUE ("core modules are NOT part of this table"), so the
--     catalog row is seeded is_core = FALSE with default_install + locked;
--     always-on semantics come from locked/default_install + the backfill.
--   * catalog:system:manage is seeded is_system = FALSE to preserve the
--     Sprint 02 invariant (every is_system = TRUE permission is domain
--     'core' and granted to TENANT_OWNER/TENANT_ADMIN). Platform admins are
--     authorised by role (PlatformRoleRequiredFilter), not by RBAC rows.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions: btree_gist for EXCLUDE on scalar columns, pg_trgm for
--    autocomplete search on catalog_items.name.
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------
-- 1. Catalog types (DES-DB-S05-001 section 2.1)
--    tenant_id NULL = system type (read-only for tenants).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog_types (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
    source               VARCHAR(16)  NOT NULL DEFAULT 'PLUGIN',
    source_ref           VARCHAR(64),
    attributes_schema    JSONB,
    status               VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_catalog_type_mode CHECK (hierarchy_mode IN ('TREE', 'DAG', 'FLAT')),
    CONSTRAINT chk_catalog_type_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_catalog_type_code UNIQUE NULLS NOT DISTINCT (tenant_id, code)
);

-- ---------------------------------------------------------------------
-- 2. Catalog items (versioned + valid time, DES-DB-S05-001 section 2.2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog_items (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
    -- No overlapping validity for the same (tenant, type, code). COALESCE keeps
    -- system rows (tenant_id NULL) constrained too: NULL is never equal to NULL
    -- inside an EXCLUDE constraint.
    CONSTRAINT ex_catalog_item_window EXCLUDE USING gist (
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
        type_id WITH =,
        code WITH =,
        tstzrange(valid_from, valid_to) WITH &&
    )
);

-- ---------------------------------------------------------------------
-- 3. Catalog item edges (multi-parent, skip-level, valid time)
--    DES-DB-S05-001 section 2.3
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog_item_edges (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
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

-- ---------------------------------------------------------------------
-- 4. Catalog type grants (per-role read/write on a catalog type)
--    DES-DB-S05-001 section 2.4
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog_type_grants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type_id    UUID NOT NULL REFERENCES catalog_types(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    can_read   BOOLEAN NOT NULL DEFAULT TRUE,
    can_write  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_catalog_type_grant UNIQUE (tenant_id, type_id, role_id)
);

-- ---------------------------------------------------------------------
-- 5. Indexes (DES-DB-S05-001 section 3)
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_catalog_edges_parent ON catalog_item_edges (parent_item_id) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_edges_child  ON catalog_item_edges (child_item_id)  WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_edges_tenant ON catalog_item_edges (tenant_id, relation_type);

CREATE INDEX IF NOT EXISTS idx_catalog_items_lookup ON catalog_items (tenant_id, type_id, code) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_items_group  ON catalog_items (version_group_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_items_name_trgm ON catalog_items USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_catalog_types_tenant ON catalog_types (tenant_id, status);

-- ---------------------------------------------------------------------
-- 6. Seed: plugin catalog row for the core in-process plugin `catalog`
--    (DES-DB-S05-001 section 5.1). is_core must stay FALSE because of
--    chk_plugin_visibility (V3.0.0); locked + default_install give the
--    always-on behaviour.
-- ---------------------------------------------------------------------
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility,
                            default_install, locked, is_core, catalog_status)
VALUES ('catalog', 'PLUGIN_CATALOG_NAME', 'PLUGIN_CATALOG_DESCRIPTION', 'PLATFORM',
        TRUE, TRUE, FALSE, 'ACTIVE')
ON CONFLICT (plugin_key) DO UPDATE
    SET default_install = TRUE,
        locked = TRUE;

-- ---------------------------------------------------------------------
-- 7. Seed: catalog module permissions (DES-DB-S05-001 section 5.2).
--    The first four are tenant-grantable; catalog:system:manage is only
--    checked by the platform portal (role guard), never granted to tenants.
-- ---------------------------------------------------------------------
INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
    ('catalog:type:manage',        'catalog', 'type',   'manage',        'PERM_CATALOG_TYPE_MANAGE',        FALSE),
    ('catalog:item:read',          'catalog', 'item',   'read',          'PERM_CATALOG_ITEM_READ',          FALSE),
    ('catalog:item:manage',        'catalog', 'item',   'manage',        'PERM_CATALOG_ITEM_MANAGE',        FALSE),
    ('catalog:item:inline-create', 'catalog', 'item',   'inline-create', 'PERM_CATALOG_ITEM_INLINE_CREATE', FALSE),
    ('catalog:system:manage',      'catalog', 'system', 'manage',        'PERM_CATALOG_SYSTEM_MANAGE',      FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
  AND p.code IN ('catalog:type:manage', 'catalog:item:read',
                 'catalog:item:manage', 'catalog:item:inline-create')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 8. Seed: system catalog types (DES-DB-S05-001 section 5.3).
--    allowed_parent_types NULL = same-type parents only; DISTRICT and
--    COMMUNE accept the documented cross-type parents; JOB accepts INDUSTRY.
-- ---------------------------------------------------------------------
INSERT INTO catalog_types (tenant_id, code, name_key, hierarchy_mode, allowed_relations, allowed_parent_types, max_depth, allow_free_text)
VALUES
    (NULL, 'PROVINCE', 'CATALOG_TYPE_PROVINCE', 'TREE', '{HIERARCHY}', NULL, NULL, FALSE),
    (NULL, 'DISTRICT', 'CATALOG_TYPE_DISTRICT', 'TREE', '{HIERARCHY}', '{PROVINCE}', NULL, FALSE),
    (NULL, 'COMMUNE',  'CATALOG_TYPE_COMMUNE',  'TREE', '{HIERARCHY}', '{PROVINCE,DISTRICT}', NULL, FALSE),
    (NULL, 'INDUSTRY', 'CATALOG_TYPE_INDUSTRY', 'DAG',  '{CLASSIFICATION}', NULL, NULL, FALSE),
    (NULL, 'JOB',      'CATALOG_TYPE_JOB',      'DAG',  '{CLASSIFICATION,ALLOCATION}', '{INDUSTRY}', NULL, TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 9. Backfill: default tenant catalog types for every existing tenant
--    (N1: JOB_TITLE, DEPARTMENT, CONTRACT_TYPE, SHIFT, EDUCATION_LEVEL).
-- ---------------------------------------------------------------------
INSERT INTO catalog_types (tenant_id, code, name_key, hierarchy_mode, allowed_relations, allowed_parent_types, allow_free_text)
SELECT t.id, v.code, v.name_key, v.hierarchy_mode, v.allowed_relations::varchar(32)[], NULL, v.allow_free_text
FROM tenants t
CROSS JOIN (VALUES
    ('JOB_TITLE',       'CATALOG_TYPE_JOB_TITLE',       'DAG',  '{CLASSIFICATION}', TRUE),
    ('DEPARTMENT',      'CATALOG_TYPE_DEPARTMENT',      'TREE', '{HIERARCHY}',      FALSE),
    ('CONTRACT_TYPE',   'CATALOG_TYPE_CONTRACT_TYPE',   'FLAT', '{}',               FALSE),
    ('SHIFT',           'CATALOG_TYPE_SHIFT',           'FLAT', '{}',               FALSE),
    ('EDUCATION_LEVEL', 'CATALOG_TYPE_EDUCATION_LEVEL', 'FLAT', '{}',               FALSE)
) AS v(code, name_key, hierarchy_mode, allowed_relations, allow_free_text)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 10. Backfill: default grants — TENANT_OWNER/TENANT_ADMIN read+write on
--     every tenant type (avoids "installed but nobody can edit").
-- ---------------------------------------------------------------------
INSERT INTO catalog_type_grants (tenant_id, type_id, role_id, can_read, can_write)
SELECT t.tenant_id, t.id, r.id, TRUE, TRUE
FROM catalog_types t
JOIN roles r ON r.tenant_id IS NULL AND r.code IN ('TENANT_OWNER', 'TENANT_ADMIN')
WHERE t.tenant_id IS NOT NULL
ON CONFLICT (tenant_id, type_id, role_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 11. Backfill: one-way DEPARTMENT catalog seed from existing departments
--     (DES-DB-S05-001 section 5.4). The organization tree stays the
--     structural source of truth; the catalog only feeds form lookups.
-- ---------------------------------------------------------------------
INSERT INTO catalog_items (tenant_id, type_id, version_group_id, version, code, name, status, valid_from)
SELECT d.tenant_id, t.id, gen_random_uuid(), 1,
       COALESCE(NULLIF(d.code, ''), 'DEP-' || substr(d.id::text, 1, 8)), d.name, 'ACTIVE', now()
FROM departments d
JOIN catalog_types t ON t.tenant_id = d.tenant_id AND t.code = 'DEPARTMENT'
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_items i
    WHERE i.tenant_id = d.tenant_id AND i.type_id = t.id AND i.code = d.code AND i.valid_to IS NULL
);

-- ---------------------------------------------------------------------
-- 12. Backfill: entitle + activate the catalog plugin for every tenant
--     (pattern of V3.0.2, but ACTIVE because the plugin is always-on).
-- ---------------------------------------------------------------------
UPDATE tenants
SET allowed_plugins = CASE
        WHEN COALESCE(allowed_plugins, '[]'::jsonb) @> '["catalog"]'::jsonb THEN allowed_plugins
        ELSE COALESCE(allowed_plugins, '[]'::jsonb) || '["catalog"]'::jsonb
    END;

INSERT INTO tenant_plugins (tenant_id, catalog_id, plugin_key, status, storage_model, installed_version, installed_at, activated_at)
SELECT t.id, c.id, 'catalog', 'ACTIVE', 'DEDICATED_SCHEMA', '1.0.0', now(), now()
FROM tenants t
CROSS JOIN plugin_catalog c
WHERE c.plugin_key = 'catalog'
ON CONFLICT (tenant_id, plugin_key) DO NOTHING;

-- ---------------------------------------------------------------------
-- 13. Fail-fast verification (pattern of V3.0.2 section 3)
-- ---------------------------------------------------------------------
DO $$
DECLARE v_missing_plugins INT;
        v_missing_types INT;
BEGIN
    SELECT count(*) INTO v_missing_plugins
    FROM tenants t
    WHERE NOT EXISTS (
        SELECT 1 FROM tenant_plugins tp
        WHERE tp.tenant_id = t.id AND tp.plugin_key = 'catalog' AND tp.status = 'ACTIVE'
    );
    IF v_missing_plugins > 0 THEN
        RAISE EXCEPTION 'CATALOG-BACKFILL verification failed: % tenants without active catalog plugin', v_missing_plugins;
    END IF;

    SELECT count(*) INTO v_missing_types
    FROM tenants t
    WHERE (SELECT count(*) FROM catalog_types ct
           WHERE ct.tenant_id = t.id
             AND ct.code IN ('JOB_TITLE', 'DEPARTMENT', 'CONTRACT_TYPE', 'SHIFT', 'EDUCATION_LEVEL')) < 5;
    IF v_missing_types > 0 THEN
        RAISE EXCEPTION 'CATALOG-BACKFILL verification failed: % tenants without the 5 default catalog types', v_missing_types;
    END IF;
END $$;
