-- =====================================================================
-- V3.0.0: Sprint 03 - Plugin Manager, Distribution & Lifecycle Schema
-- DES-03-DB / SOL-01 / SOL-02 / TASK-301 / BUG-85 / BUG-86 / BUG-88 / BUG-93
-- PostgreSQL 16+, schema public. All statements are idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tenants extension (DES-03-DB section 2.8)
-- ---------------------------------------------------------------------
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS allow_custom_plugins BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS storage_model VARCHAR(24) NOT NULL DEFAULT 'DEDICATED_SCHEMA';

CREATE INDEX IF NOT EXISTS idx_tenants_allow_custom_plugins ON tenants(allow_custom_plugins);

-- ---------------------------------------------------------------------
-- 2. Plugin catalog (DES-03-DB section 2.1)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_key VARCHAR(100) NOT NULL,
    name_key VARCHAR(120) NOT NULL,
    description_key VARCHAR(120) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PLATFORM',
    owner_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    default_install BOOLEAN NOT NULL DEFAULT FALSE,
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    is_core BOOLEAN NOT NULL DEFAULT FALSE,
    catalog_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    blocked_reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE,
    blocked_by UUID,
    entitlement_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_plugin_visibility CHECK (
        (visibility = 'PLATFORM'       AND owner_tenant_id IS NULL     AND is_core = FALSE)
        OR
        (visibility = 'TENANT_PRIVATE' AND owner_tenant_id IS NOT NULL AND is_core = FALSE AND default_install = FALSE)
    ),
    CONSTRAINT chk_catalog_status CHECK (catalog_status IN ('ACTIVE', 'BLOCKED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_plugin_catalog_key ON plugin_catalog (plugin_key);
CREATE INDEX IF NOT EXISTS idx_plugin_catalog_default_install ON plugin_catalog (default_install) WHERE visibility = 'PLATFORM';
CREATE INDEX IF NOT EXISTS idx_plugin_catalog_owner ON plugin_catalog (owner_tenant_id) WHERE visibility = 'TENANT_PRIVATE';

-- ---------------------------------------------------------------------
-- 3. Plugin versions (DES-03-DB section 2.2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id UUID NOT NULL REFERENCES plugin_catalog(id) ON DELETE CASCADE,
    version VARCHAR(32) NOT NULL,
    release_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    core_compatibility VARCHAR(64) NOT NULL,
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    platforms JSONB NOT NULL DEFAULT '{}'::jsonb,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    ui_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
    distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
    manifest JSONB NOT NULL,
    migration_policy VARCHAR(16) NOT NULL DEFAULT 'COMPATIBLE',
    rollback_strategy VARCHAR(20) NOT NULL DEFAULT 'SNAPSHOT_RESTORE',
    template_version VARCHAR(32),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    publish_reason TEXT,
    block_reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_plugin_version UNIQUE (catalog_id, version),
    CONSTRAINT chk_release_status CHECK (release_status IN ('DRAFT', 'PUBLISHED', 'DEPRECATED', 'BLOCKED')),
    CONSTRAINT chk_migration_policy CHECK (migration_policy IN ('COMPATIBLE', 'BREAKING')),
    CONSTRAINT chk_rollback_strategy CHECK (rollback_strategy IN ('SNAPSHOT_RESTORE', 'DOWN_MIGRATION'))
);

CREATE INDEX IF NOT EXISTS idx_plugin_versions_catalog_status ON plugin_versions (catalog_id, release_status);

-- BUG-93: publish guard - catalog BLOCKED must reject PUBLISHED/DEPRECATED transitions
CREATE OR REPLACE FUNCTION check_version_publish_guard() RETURNS trigger AS $$
DECLARE v_catalog_status VARCHAR(16);
BEGIN
    IF NEW.release_status IN ('PUBLISHED', 'DEPRECATED') THEN
        SELECT catalog_status INTO v_catalog_status
        FROM plugin_catalog WHERE id = NEW.catalog_id;
        IF v_catalog_status = 'BLOCKED' THEN
            RAISE EXCEPTION 'PLUGIN_BLOCKED_BY_PLATFORM: catalog is blocked';
        END IF;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plugin_version_publish_guard ON plugin_versions;
CREATE TRIGGER trg_plugin_version_publish_guard
BEFORE INSERT OR UPDATE ON plugin_versions
FOR EACH ROW EXECUTE FUNCTION check_version_publish_guard();

-- BUG-93: platform-only unblock of a BLOCKED version (atomic w.r.t. catalog lock)
CREATE OR REPLACE FUNCTION unblock_plugin_version(p_catalog_id UUID, p_version VARCHAR, p_actor UUID, p_reason TEXT) RETURNS VOID AS $$
BEGIN
    PERFORM 1 FROM plugin_catalog WHERE id = p_catalog_id AND catalog_status = 'ACTIVE' FOR SHARE;
    UPDATE plugin_versions
    SET release_status = 'PUBLISHED', block_reason = NULL, blocked_at = NULL
    WHERE catalog_id = p_catalog_id AND version = p_version AND release_status = 'BLOCKED';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PLUGIN_VERSION_NOT_BLOCKED: version not in BLOCKED state';
    END IF;
END $$ LANGUAGE plpgsql;

-- BUG-93: platform-only unblock of the catalog (P25)
CREATE OR REPLACE FUNCTION unblock_plugin_catalog(p_catalog_id UUID, p_actor UUID, p_reason TEXT) RETURNS VOID AS $$
BEGIN
    UPDATE plugin_catalog
    SET catalog_status = 'ACTIVE', blocked_reason = NULL, blocked_at = NULL, blocked_by = NULL
    WHERE id = p_catalog_id AND catalog_status = 'BLOCKED';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PLUGIN_CATALOG_NOT_BLOCKED: catalog not in BLOCKED state';
    END IF;
END $$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 4. Tenant plugins ledger (DES-03-DB section 2.3) - single table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    catalog_id UUID NOT NULL REFERENCES plugin_catalog(id) ON DELETE RESTRICT,
    plugin_key VARCHAR(100) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'NOT_INSTALLED',
    installed_version VARCHAR(32),
    target_version VARCHAR(32),
    storage_model VARCHAR(24) NOT NULL DEFAULT 'DEDICATED_SCHEMA',
    storage_schema VARCHAR(63),
    deploy_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_error_code VARCHAR(80),
    last_error_params JSONB,
    operation_id UUID,
    row_version INT NOT NULL DEFAULT 0,
    installed_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    uninstalled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_plugin UNIQUE (tenant_id, plugin_key),
    CONSTRAINT chk_tenant_plugin_status CHECK (status IN (
        'NOT_INSTALLED', 'INSTALLING', 'ACTIVE', 'INACTIVE', 'UPGRADING',
        'INSTALL_FAILED', 'ROLLBACK_FAILED', 'UNINSTALLING', 'UNINSTALLED'
    )),
    CONSTRAINT chk_tenant_plugin_storage CHECK (storage_model IN ('DEDICATED_SCHEMA', 'DEDICATED_DATABASE'))
);

CREATE INDEX IF NOT EXISTS idx_tenant_plugins_tenant_status ON tenant_plugins (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_plugins_plugin_status ON tenant_plugins (plugin_key, status);
CREATE INDEX IF NOT EXISTS idx_tenant_plugins_operation ON tenant_plugins (operation_id) WHERE operation_id IS NOT NULL;

-- BUG-85: tenant may only use PLATFORM plugins or its own TENANT_PRIVATE plugins
CREATE OR REPLACE FUNCTION check_tenant_plugin_scope() RETURNS trigger AS $$
DECLARE v_visibility VARCHAR(20); v_owner UUID;
BEGIN
    SELECT visibility, owner_tenant_id INTO v_visibility, v_owner
    FROM plugin_catalog WHERE id = NEW.catalog_id;
    IF v_visibility = 'TENANT_PRIVATE' AND v_owner <> NEW.tenant_id THEN
        RAISE EXCEPTION 'PLUGIN_NOT_ENTITLED: tenant % cannot use private plugin of tenant %', NEW.tenant_id, v_owner;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_plugin_scope ON tenant_plugins;
CREATE TRIGGER trg_tenant_plugin_scope
BEFORE INSERT OR UPDATE ON tenant_plugins
FOR EACH ROW EXECUTE FUNCTION check_tenant_plugin_scope();

-- ---------------------------------------------------------------------
-- 5. Plugin credentials (DES-03-DB section 2.4)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(16) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    registry_host VARCHAR(255) NOT NULL,
    username VARCHAR(200),
    secret_cipher TEXT NOT NULL,
    secret_nonce VARCHAR(64) NOT NULL,
    key_version INT NOT NULL DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_credential_scope CHECK (
        (scope = 'PLATFORM' AND tenant_id IS NULL)
        OR
        (scope = 'TENANT' AND tenant_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_plugin_credentials_platform_host
    ON plugin_credentials (registry_host, name) WHERE scope = 'PLATFORM';
CREATE UNIQUE INDEX IF NOT EXISTS uq_plugin_credentials_tenant_host
    ON plugin_credentials (tenant_id, registry_host, name) WHERE scope = 'TENANT';

-- ---------------------------------------------------------------------
-- 6. Plugin UI slots registry (DES-03-DB section 2.5, BUG-88)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_ui_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_code VARCHAR(120) NOT NULL,
    host_type VARCHAR(16) NOT NULL,
    owner_plugin_key VARCHAR(100),
    declared_in_version VARCHAR(32),
    title_key VARCHAR(120) NOT NULL,
    contract_version VARCHAR(16) NOT NULL DEFAULT '1.0',
    allowed_render_modes JSONB NOT NULL DEFAULT '["WEB_COMPONENT","MODULE_FEDERATION","IFRAME"]'::jsonb,
    constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ui_slot_host CHECK (
        (host_type = 'CORE'   AND owner_plugin_key IS NULL     AND declared_in_version IS NULL)
        OR
        (host_type = 'PLUGIN' AND owner_plugin_key IS NOT NULL AND declared_in_version IS NOT NULL)
    ),
    CONSTRAINT chk_ui_slot_status CHECK (status IN ('ACTIVE', 'DEPRECATED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_plugin_ui_slot_core
    ON plugin_ui_slots (slot_code) WHERE host_type = 'CORE';
CREATE UNIQUE INDEX IF NOT EXISTS uq_plugin_ui_slot_plugin
    ON plugin_ui_slots (owner_plugin_key, slot_code, contract_version) WHERE host_type = 'PLUGIN';
CREATE INDEX IF NOT EXISTS idx_plugin_ui_slots_owner
    ON plugin_ui_slots (owner_plugin_key) WHERE host_type = 'PLUGIN';

-- Seed Core standard slots (BUG-92: conflict target matches partial unique index predicate)
INSERT INTO plugin_ui_slots (slot_code, host_type, title_key, contract_version, constraints)
VALUES
 ('core.dashboard.widgets', 'CORE', 'PLUGIN_SLOT_CORE_DASHBOARD_WIDGETS', '1.0', '{"max_contributions":6,"min_height_px":120}'),
 ('core.settings.sections', 'CORE', 'PLUGIN_SLOT_CORE_SETTINGS_SECTIONS', '1.0', '{"max_contributions":10}')
ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO NOTHING;

-- ---------------------------------------------------------------------
-- 7. Plugin operation logs (DES-03-DB section 2.6 - append-only saga trail)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_operation_logs (
    id BIGSERIAL PRIMARY KEY,
    operation_id UUID NOT NULL,
    tenant_id UUID,
    plugin_key VARCHAR(100) NOT NULL,
    operation VARCHAR(40) NOT NULL,
    step VARCHAR(60) NOT NULL,
    result VARCHAR(16) NOT NULL,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_op_result CHECK (result IN ('STARTED', 'OK', 'FAILED', 'COMPENSATED'))
);

CREATE INDEX IF NOT EXISTS idx_plugin_op_logs_operation ON plugin_operation_logs (operation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_plugin_op_logs_plugin ON plugin_operation_logs (plugin_key, created_at DESC);

-- ---------------------------------------------------------------------
-- 8. Tenant notifications (DES-03-DB section 2.7)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title_code VARCHAR(120) NOT NULL,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity VARCHAR(16) NOT NULL DEFAULT 'INFO',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notification_severity CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_tenant_notifications_tenant_unread
    ON tenant_notifications (tenant_id, created_at DESC) WHERE read_at IS NULL;
