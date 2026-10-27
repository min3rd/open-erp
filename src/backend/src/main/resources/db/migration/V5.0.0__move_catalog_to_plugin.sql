-- =====================================================================
-- V5.0.0: Sprint 05 P2 - move catalog out of core into the plugin model
-- ADR-S05-001 A3/A4/A5/A6/A12/A13. PostgreSQL 16+.
--
-- 1. Seed the hidden SYSTEM tenant (platform-scoped catalog instance).
-- 2. Publish catalog plugin version 1.0.0 in plugin_catalog/plugin_versions.
-- 3. Create one catalog schema per tenant + the system tenant schema.
-- 4. Copy system rows into every schema and tenant rows into their schema.
-- 5. Verify row counts, then drop the old public catalog tables.
--
-- The plugin's own Flyway migration (V1.0.0) is idempotent: it sees the
-- tables already created here and only ensures the system type seed.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------
-- 1. Hidden system tenant (fixed UUID; no users, excluded from lists)
-- ---------------------------------------------------------------------
INSERT INTO tenants (id, slug, name, type, status, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'system', 'Platform System',
        'SYSTEM', 'ACTIVE', now(), now())
ON CONFLICT (id) DO UPDATE
SET slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    type = 'SYSTEM',
    status = 'ACTIVE',
    updated_at = now();

-- ---------------------------------------------------------------------
-- 2. Catalog plugin row + published version 1.0.0
-- ---------------------------------------------------------------------
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility,
                            default_install, locked, is_core, catalog_status)
VALUES ('catalog', 'PLUGIN_CATALOG_NAME', 'PLUGIN_CATALOG_DESCRIPTION', 'PLATFORM',
        TRUE, TRUE, FALSE, 'ACTIVE')
ON CONFLICT (plugin_key) DO UPDATE
SET default_install = TRUE,
    locked = TRUE,
    catalog_status = 'ACTIVE',
    updated_at = now();

INSERT INTO plugin_versions (
    catalog_id, version, release_status, core_compatibility, dependencies,
    platforms, permissions, entities, ui_manifest, distribution, manifest,
    migration_policy, rollback_strategy, template_version, created_at,
    published_at, publish_reason
)
SELECT c.id, '1.0.0', 'PUBLISHED', '>=1.0.0 <2.0.0', '[]'::jsonb,
       '{"desktop":{"supported":true,"features":["catalog_type_admin","catalog_item_admin","catalog_edge_admin","catalog_grants_admin","catalog_import_export","catalog_system_admin"]},"mobile":{"supported":true,"features":["catalog_browse","catalog_picker"]}}'::jsonb,
       '[{"code":"catalog:type:manage","name":"Quản lý loại danh mục của tenant"},{"code":"catalog:item:read","name":"Xem bản ghi danh mục"},{"code":"catalog:item:manage","name":"Thêm/sửa/ngừng dùng bản ghi danh mục"},{"code":"catalog:item:inline-create","name":"Lưu nhanh giá trị nhập tự do vào danh mục"},{"code":"catalog:system:manage","name":"Quản trị danh mục hệ thống (cổng Platform)"}]'::jsonb,
       '[{"name":"CatalogType","storage":"postgres","table":"catalog_types","public_fields":["id","tenant_id","code","name_key","description_key","hierarchy_mode","allowed_relations","allowed_parent_types","max_depth","min_parents","allow_free_text","versioned","effective_dated","status","created_at","updated_at"]},{"name":"CatalogItem","storage":"postgres","table":"catalog_items","public_fields":["id","tenant_id","type_id","version_group_id","version","code","name","name_en","description","sort_order","status","valid_from","valid_to","supersedes_item_id","created_at","updated_at"]},{"name":"CatalogItemEdge","storage":"postgres","table":"catalog_item_edges","public_fields":["id","tenant_id","parent_item_id","child_item_id","relation_type","sort_order","status","valid_from","valid_to","created_at"]},{"name":"CatalogTypeGrant","storage":"postgres","table":"catalog_type_grants","public_fields":["id","tenant_id","type_id","role_code","can_read","can_write","created_at","updated_at"]}]'::jsonb,
       '{"contract_version":"1.0","screens":[{"route":"/apps/catalog","title_key":"CATALOG_SECTION_TITLE","permission":"catalog:item:read","render_mode":"IFRAME","order":150,"platforms":["desktop"]},{"route":"/apps/catalog","title_key":"CATALOG_SECTION_TITLE","permission":"catalog:item:read","render_mode":"IFRAME","order":150,"platforms":["mobile"],"read_only":true},{"route":"/platform/apps/catalog","title_key":"CATALOG_SECTION_TITLE","permission":"catalog:system:manage","render_mode":"IFRAME","order":200,"platforms":["desktop"]}],"contributions":[],"slots":[]}'::jsonb,
       '{"type":"IMAGE_REGISTRY","registry_url":"","repository":"open-erp/catalog","tag":"1.0.0"}'::jsonb,
       '{"id":"catalog","name":"Danh mục & quản trị danh mục","description":"Plugin độc lập: hạ tầng danh mục dùng chung (quan hệ đa cha, phiên bản + hiệu lực, tra cứu cho form động, import/export, system catalog fan-out).","version":"1.0.0","author":"Open-ERP Core Team","core_version_compatibility":">=1.0.0 <2.0.0","packaging":"image","migration_policy":"COMPATIBLE","rollback_strategy":"SNAPSHOT_RESTORE","template_version":"0.1.0","dependencies":[],"platforms":{"desktop":{"supported":true,"features":["catalog_type_admin","catalog_item_admin","catalog_edge_admin","catalog_grants_admin","catalog_import_export","catalog_system_admin"]},"mobile":{"supported":true,"features":["catalog_browse","catalog_picker"]}},"permissions":[{"code":"catalog:type:manage","name":"Quản lý loại danh mục của tenant"},{"code":"catalog:item:read","name":"Xem bản ghi danh mục"},{"code":"catalog:item:manage","name":"Thêm/sửa/ngừng dùng bản ghi danh mục"},{"code":"catalog:item:inline-create","name":"Lưu nhanh giá trị nhập tự do vào danh mục"},{"code":"catalog:system:manage","name":"Quản trị danh mục hệ thống (cổng Platform)"}],"entities":[{"name":"CatalogType","storage":"postgres","table":"catalog_types","public_fields":["id","tenant_id","code","name_key","description_key","hierarchy_mode","allowed_relations","allowed_parent_types","max_depth","min_parents","allow_free_text","versioned","effective_dated","status","created_at","updated_at"]},{"name":"CatalogItem","storage":"postgres","table":"catalog_items","public_fields":["id","tenant_id","type_id","version_group_id","version","code","name","name_en","description","sort_order","status","valid_from","valid_to","supersedes_item_id","created_at","updated_at"]},{"name":"CatalogItemEdge","storage":"postgres","table":"catalog_item_edges","public_fields":["id","tenant_id","parent_item_id","child_item_id","relation_type","sort_order","status","valid_from","valid_to","created_at"]},{"name":"CatalogTypeGrant","storage":"postgres","table":"catalog_type_grants","public_fields":["id","tenant_id","type_id","role_code","can_read","can_write","created_at","updated_at"]}],"kafka_events":{"publishes":[],"subscribes":[]},"ui_manifest":{"contract_version":"1.0","screens":[{"route":"/apps/catalog","title_key":"CATALOG_SECTION_TITLE","permission":"catalog:item:read","render_mode":"IFRAME","order":150,"platforms":["desktop"]},{"route":"/apps/catalog","title_key":"CATALOG_SECTION_TITLE","permission":"catalog:item:read","render_mode":"IFRAME","order":150,"platforms":["mobile"],"read_only":true},{"route":"/platform/apps/catalog","title_key":"CATALOG_SECTION_TITLE","permission":"catalog:system:manage","render_mode":"IFRAME","order":200,"platforms":["desktop"]}],"contributions":[],"slots":[]},"distribution":{"type":"IMAGE_REGISTRY","registry_url":"","repository":"open-erp/catalog","tag":"1.0.0"}}'::jsonb,
       'COMPATIBLE', 'SNAPSHOT_RESTORE', '0.1.0', now(), now(),
       'Sprint 05 P2: catalog plugin v1.0.0'
FROM plugin_catalog c
WHERE c.plugin_key = 'catalog'
ON CONFLICT (catalog_id, version) DO UPDATE
SET release_status = 'PUBLISHED',
    core_compatibility = EXCLUDED.core_compatibility,
    platforms = EXCLUDED.platforms,
    permissions = EXCLUDED.permissions,
    entities = EXCLUDED.entities,
    ui_manifest = EXCLUDED.ui_manifest,
    distribution = EXCLUDED.distribution,
    manifest = EXCLUDED.manifest,
    published_at = EXCLUDED.published_at,
    publish_reason = EXCLUDED.publish_reason;

-- ---------------------------------------------------------------------
-- 3. Bootstrap one catalog schema (same DDL as the plugin migration)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION catalog_bootstrap_schema(p_schema text) RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_types (
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
        )$ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_items (
            id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id          UUID,
            type_id            UUID NOT NULL REFERENCES %I.catalog_types(id) ON DELETE RESTRICT,
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
            supersedes_item_id UUID REFERENCES %I.catalog_items(id),
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
        )$ddl$, p_schema, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_item_edges (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id      UUID,
            parent_item_id UUID NOT NULL REFERENCES %I.catalog_items(id) ON DELETE RESTRICT,
            child_item_id  UUID NOT NULL REFERENCES %I.catalog_items(id) ON DELETE RESTRICT,
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
        )$ddl$, p_schema, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_type_grants (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id  UUID NOT NULL,
            type_id    UUID NOT NULL REFERENCES %I.catalog_types(id) ON DELETE CASCADE,
            role_code  VARCHAR(80) NOT NULL,
            can_read   BOOLEAN NOT NULL DEFAULT TRUE,
            can_write  BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_catalog_type_grant UNIQUE (tenant_id, type_id, role_code)
        )$ddl$, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_audit (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id     UUID,
            actor_user_id UUID,
            action        VARCHAR(80) NOT NULL,
            resource_type VARCHAR(80),
            resource_id   UUID,
            result        VARCHAR(16) NOT NULL DEFAULT 'SUCCESS',
            details       JSONB,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )$ddl$, p_schema);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_catalog_edges_parent ON %I.catalog_item_edges (parent_item_id) WHERE valid_to IS NULL', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_catalog_edges_child ON %I.catalog_item_edges (child_item_id) WHERE valid_to IS NULL', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_catalog_edges_tenant ON %I.catalog_item_edges (tenant_id, relation_type)', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_catalog_items_lookup ON %I.catalog_items (tenant_id, type_id, code) WHERE valid_to IS NULL', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_catalog_items_group ON %I.catalog_items (version_group_id, version DESC)', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_catalog_items_name_trgm ON %I.catalog_items USING gin (name public.gin_trgm_ops)', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_catalog_types_tenant ON %I.catalog_types (tenant_id, status)', p_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_catalog_audit_tenant ON %I.catalog_audit (tenant_id, created_at DESC)', p_schema);
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 4. System tenant schema: canonical system catalog
-- ---------------------------------------------------------------------
SELECT catalog_bootstrap_schema('tenant_00000000_catalog');

INSERT INTO tenant_00000000_catalog.catalog_types
SELECT * FROM public.catalog_types WHERE tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO tenant_00000000_catalog.catalog_items
SELECT * FROM public.catalog_items WHERE tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO tenant_00000000_catalog.catalog_item_edges
SELECT * FROM public.catalog_item_edges WHERE tenant_id IS NULL
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. Every existing tenant: system copy + own rows + grants
-- ---------------------------------------------------------------------
DO $$
DECLARE
    t RECORD;
    v_schema TEXT;
    v_ledger_id UUID;
BEGIN
    FOR t IN SELECT id FROM tenants WHERE id <> '00000000-0000-0000-0000-000000000001' LOOP
        v_schema := 'tenant_' || substr(replace(t.id::text, '-', ''), 1, 8) || '_catalog';
        PERFORM catalog_bootstrap_schema(v_schema);

        EXECUTE format('INSERT INTO %I.catalog_types SELECT * FROM public.catalog_types WHERE tenant_id IS NULL OR tenant_id = %L ON CONFLICT DO NOTHING', v_schema, t.id);
        EXECUTE format('INSERT INTO %I.catalog_items SELECT * FROM public.catalog_items WHERE tenant_id IS NULL OR tenant_id = %L ON CONFLICT DO NOTHING', v_schema, t.id);
        EXECUTE format('INSERT INTO %I.catalog_item_edges SELECT * FROM public.catalog_item_edges WHERE tenant_id IS NULL OR tenant_id = %L ON CONFLICT DO NOTHING', v_schema, t.id);
        EXECUTE format($g$INSERT INTO %I.catalog_type_grants (id, tenant_id, type_id, role_code, can_read, can_write, created_at, updated_at)
            SELECT g.id, g.tenant_id, g.type_id, r.code, g.can_read, g.can_write, g.created_at, g.updated_at
            FROM public.catalog_type_grants g JOIN public.roles r ON r.id = g.role_id
            WHERE g.tenant_id = %L ON CONFLICT DO NOTHING$g$, v_schema, t.id);

        SELECT id INTO v_ledger_id FROM tenant_plugins WHERE tenant_id = t.id AND plugin_key = 'catalog';
        IF v_ledger_id IS NULL THEN
            INSERT INTO tenant_plugins (tenant_id, catalog_id, plugin_key, status, storage_model,
                                        storage_schema, installed_version, installed_at, activated_at)
            SELECT t.id, c.id, 'catalog', 'ACTIVE', 'DEDICATED_SCHEMA',
                   v_schema, '1.0.0', now(), now()
            FROM plugin_catalog c WHERE c.plugin_key = 'catalog';
        ELSE
            UPDATE tenant_plugins
            SET status = 'ACTIVE', storage_model = 'DEDICATED_SCHEMA', storage_schema = v_schema,
                installed_version = '1.0.0', installed_at = COALESCE(installed_at, now()),
                activated_at = COALESCE(activated_at, now()), updated_at = now()
            WHERE id = v_ledger_id;
        END IF;

        UPDATE tenants
        SET allowed_plugins = CASE
            WHEN COALESCE(allowed_plugins, '[]'::jsonb) @> '["catalog"]'::jsonb THEN allowed_plugins
            ELSE COALESCE(allowed_plugins, '[]'::jsonb) || '["catalog"]'::jsonb
        END
        WHERE id = t.id;
    END LOOP;

    -- System tenant ledger + allowlist
    INSERT INTO tenant_plugins (tenant_id, catalog_id, plugin_key, status, storage_model,
                                storage_schema, installed_version, installed_at, activated_at)
    SELECT '00000000-0000-0000-0000-000000000001', c.id, 'catalog', 'ACTIVE', 'DEDICATED_SCHEMA',
           'tenant_00000000_catalog', '1.0.0', now(), now()
    FROM plugin_catalog c WHERE c.plugin_key = 'catalog'
    ON CONFLICT (tenant_id, plugin_key) DO UPDATE
    SET status = 'ACTIVE', storage_schema = EXCLUDED.storage_schema,
        installed_version = EXCLUDED.installed_version, updated_at = now();

    UPDATE tenants
    SET allowed_plugins = CASE
        WHEN COALESCE(allowed_plugins, '[]'::jsonb) @> '["catalog"]'::jsonb THEN allowed_plugins
        ELSE COALESCE(allowed_plugins, '[]'::jsonb) || '["catalog"]'::jsonb
    END
    WHERE id = '00000000-0000-0000-0000-000000000001';
END $$;

-- ---------------------------------------------------------------------
-- 6. Fail-fast verification before dropping the public tables
-- ---------------------------------------------------------------------
DO $$
DECLARE
    t RECORD;
    v_schema TEXT;
    v_public BIGINT;
    v_copy BIGINT;
BEGIN
    SELECT count(*) INTO v_public FROM public.catalog_types WHERE tenant_id IS NULL;
    SELECT count(*) INTO v_copy FROM tenant_00000000_catalog.catalog_types WHERE tenant_id IS NULL;
    IF v_public <> v_copy THEN
        RAISE EXCEPTION 'CATALOG-V5 verify failed for system types: public=% copied=%', v_public, v_copy;
    END IF;

    FOR t IN SELECT id FROM tenants WHERE id <> '00000000-0000-0000-0000-000000000001' LOOP
        v_schema := 'tenant_' || substr(replace(t.id::text, '-', ''), 1, 8) || '_catalog';

        SELECT count(*) INTO v_public FROM public.catalog_types WHERE tenant_id IS NULL OR tenant_id = t.id;
        EXECUTE format('SELECT count(*) FROM %I.catalog_types', v_schema) INTO v_copy;
        IF v_public <> v_copy THEN
            RAISE EXCEPTION 'CATALOG-V5 verify failed for % types: public=% copied=%', t.id, v_public, v_copy;
        END IF;

        SELECT count(*) INTO v_public FROM public.catalog_items WHERE tenant_id IS NULL OR tenant_id = t.id;
        EXECUTE format('SELECT count(*) FROM %I.catalog_items', v_schema) INTO v_copy;
        IF v_public <> v_copy THEN
            RAISE EXCEPTION 'CATALOG-V5 verify failed for % items: public=% copied=%', t.id, v_public, v_copy;
        END IF;

        SELECT count(*) INTO v_public FROM public.catalog_item_edges WHERE tenant_id IS NULL OR tenant_id = t.id;
        EXECUTE format('SELECT count(*) FROM %I.catalog_item_edges', v_schema) INTO v_copy;
        IF v_public <> v_copy THEN
            RAISE EXCEPTION 'CATALOG-V5 verify failed for % edges: public=% copied=%', t.id, v_public, v_copy;
        END IF;

        SELECT count(*) INTO v_public FROM public.catalog_type_grants WHERE tenant_id = t.id;
        EXECUTE format('SELECT count(*) FROM %I.catalog_type_grants', v_schema) INTO v_copy;
        IF v_public <> v_copy THEN
            RAISE EXCEPTION 'CATALOG-V5 verify failed for % grants: public=% copied=%', t.id, v_public, v_copy;
        END IF;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 7. Drop the old core-owned catalog tables
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS public.catalog_type_grants;
DROP TABLE IF EXISTS public.catalog_item_edges;
DROP TABLE IF EXISTS public.catalog_items;
DROP TABLE IF EXISTS public.catalog_types;
DROP FUNCTION IF EXISTS catalog_bootstrap_schema(text);
