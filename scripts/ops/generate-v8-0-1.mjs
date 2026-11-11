import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const orgManifest = JSON.parse(readFileSync('plugins/organization/plugin.json', 'utf8'));

// Format JSON strings for SQL literal (escaping single quotes)
function escapeSqlString(str) {
  return str.replaceAll("'", "''");
}

const orgPlatformsJson = escapeSqlString(JSON.stringify(orgManifest.platforms));
const orgPermissionsJson = escapeSqlString(JSON.stringify(orgManifest.permissions));
const orgEntitiesJson = escapeSqlString(JSON.stringify(orgManifest.entities));
const orgUiManifestJson = escapeSqlString(JSON.stringify(orgManifest.ui_manifest));
const orgDistributionJson = escapeSqlString(JSON.stringify(orgManifest.distribution));
const orgManifestJson = escapeSqlString(JSON.stringify(orgManifest));

const sql = `-- =====================================================================
-- V8.0.1: Sprint 08 - Default locked plugins & dependency hierarchy
-- 1. plugin_catalog: catalog, org-structure, employee, form, workflow (default_install=TRUE, locked=TRUE)
-- 2. plugin_versions: org-structure 1.1.3 published and dependencies updated:
--      catalog       -> []
--      org-structure -> []
--      form          -> [catalog]
--      workflow      -> [org-structure]
--      employee      -> [catalog, org-structure, workflow]
-- 3. permissions & role_permissions for system roles
-- 4. Per-tenant schema bootstrap (catalog, org_structure, employee, form, workflow)
-- 5. Backfill tenants.allowed_plugins & tenant_plugins (ACTIVE)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Plugin catalog: ensure all 5 default plugins are default_install=TRUE, locked=TRUE
-- ---------------------------------------------------------------------
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility,
                            default_install, locked, is_core, catalog_status)
VALUES
    ('catalog',       'PLUGIN_CATALOG_NAME',    'PLUGIN_CATALOG_DESCRIPTION',  'PLATFORM', TRUE, TRUE, FALSE, 'ACTIVE'),
    ('org-structure', 'ORGANIZATION_STRUCTURE', 'ORGANIZATION_STRUCTURE',      'PLATFORM', TRUE, TRUE, FALSE, 'ACTIVE'),
    ('employee',      'PLUGIN_EMPLOYEE_TITLE',  'PLUGIN_EMPLOYEE_DESCRIPTION', 'PLATFORM', TRUE, TRUE, FALSE, 'ACTIVE'),
    ('form',          'PLUGIN_FORM_TITLE',      'PLUGIN_FORM_SUBTITLE',        'PLATFORM', TRUE, TRUE, FALSE, 'ACTIVE'),
    ('workflow',      'PLUGIN_WORKFLOW_TITLE',  'PLUGIN_WORKFLOW_SUBTITLE',    'PLATFORM', TRUE, TRUE, FALSE, 'ACTIVE')
ON CONFLICT (plugin_key) DO UPDATE
    SET name_key = EXCLUDED.name_key,
        description_key = EXCLUDED.description_key,
        visibility = 'PLATFORM',
        default_install = TRUE,
        locked = TRUE,
        is_core = FALSE,
        catalog_status = 'ACTIVE',
        updated_at = now();

-- ---------------------------------------------------------------------
-- 2. Plugin versions: org-structure published & updated dependencies
-- ---------------------------------------------------------------------
INSERT INTO plugin_versions (
    catalog_id, version, release_status, core_compatibility, dependencies,
    platforms, permissions, entities, ui_manifest, distribution, manifest,
    migration_policy, rollback_strategy, template_version, created_at,
    published_at, publish_reason
)
SELECT c.id, '1.1.3', 'PUBLISHED', '>=1.0.0 <2.0.0', '[]'::jsonb,
       '${orgPlatformsJson}'::jsonb,
       '${orgPermissionsJson}'::jsonb,
       '${orgEntitiesJson}'::jsonb,
       '${orgUiManifestJson}'::jsonb,
       '${orgDistributionJson}'::jsonb,
       '${orgManifestJson}'::jsonb,
       'COMPATIBLE', 'SNAPSHOT_RESTORE', '2.0.0', now(), now(),
       'Sprint 07 Organization Structure default locked plugin'
FROM plugin_catalog c
WHERE c.plugin_key = 'org-structure'
ON CONFLICT (catalog_id, version) DO UPDATE
    SET release_status = 'PUBLISHED',
        dependencies = '[]'::jsonb,
        platforms = EXCLUDED.platforms,
        permissions = EXCLUDED.permissions,
        entities = EXCLUDED.entities,
        ui_manifest = EXCLUDED.ui_manifest,
        distribution = EXCLUDED.distribution,
        manifest = EXCLUDED.manifest,
        published_at = now(),
        publish_reason = 'Sprint 07 Organization Structure default locked plugin';

-- Update dependencies in plugin_versions
UPDATE plugin_versions
SET dependencies = '[]'::jsonb,
    manifest = jsonb_set(manifest, '{dependencies}', '[]'::jsonb)
WHERE catalog_id = (SELECT id FROM plugin_catalog WHERE plugin_key = 'catalog');

UPDATE plugin_versions
SET dependencies = '[{"key": "catalog", "min_version": "1.0.0"}]'::jsonb,
    manifest = jsonb_set(manifest, '{dependencies}', '[{"key": "catalog", "min_version": "1.0.0"}]'::jsonb)
WHERE catalog_id = (SELECT id FROM plugin_catalog WHERE plugin_key = 'form');

UPDATE plugin_versions
SET dependencies = '[{"key": "org-structure", "min_version": "1.1.0"}]'::jsonb,
    manifest = jsonb_set(manifest, '{dependencies}', '[{"key": "org-structure", "min_version": "1.1.0"}]'::jsonb)
WHERE catalog_id = (SELECT id FROM plugin_catalog WHERE plugin_key = 'workflow');

UPDATE plugin_versions
SET dependencies = '[{"key": "catalog", "min_version": "1.0.0"}, {"key": "org-structure", "min_version": "1.1.0"}, {"key": "workflow", "min_version": "1.0.0"}]'::jsonb,
    manifest = jsonb_set(manifest, '{dependencies}', '[{"key": "catalog", "min_version": "1.0.0"}, {"key": "org-structure", "min_version": "1.1.0"}, {"key": "workflow", "min_version": "1.0.0"}]'::jsonb)
WHERE catalog_id = (SELECT id FROM plugin_catalog WHERE plugin_key = 'employee');

-- ---------------------------------------------------------------------
-- 3. Seed permissions & role_permissions for system roles
-- ---------------------------------------------------------------------
INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
    ('organization:org:manage',           'organization', 'org',           'manage', 'PERM_ORGANIZATION_ORG_MANAGE',           FALSE),
    ('organization:org:read',             'organization', 'org',           'read',   'PERM_ORGANIZATION_ORG_READ',             FALSE),
    ('organization:branch:read',          'organization', 'branch',        'read',   'PERM_ORGANIZATION_BRANCH_READ',          FALSE),
    ('organization:branch:manage',        'organization', 'branch',        'manage', 'PERM_ORGANIZATION_BRANCH_MANAGE',        FALSE),
    ('organization:department:read',      'organization', 'department',    'read',   'PERM_ORGANIZATION_DEPARTMENT_READ',      FALSE),
    ('organization:department:manage',    'organization', 'department',    'manage', 'PERM_ORGANIZATION_DEPARTMENT_MANAGE',    FALSE),
    ('organization:membership:read',      'organization', 'membership',    'read',   'PERM_ORGANIZATION_MEMBERSHIP_READ',      FALSE),
    ('organization:membership:manage',    'organization', 'membership',    'manage', 'PERM_ORGANIZATION_MEMBERSHIP_MANAGE',    FALSE),
    ('organization:branch-access:read',   'organization', 'branch-access', 'read',   'PERM_ORGANIZATION_BRANCH_ACCESS_READ',   FALSE),
    ('organization:branch-access:manage', 'organization', 'branch-access', 'manage', 'PERM_ORGANIZATION_BRANCH_ACCESS_MANAGE', FALSE),
    ('organization:org-chart:read',       'organization', 'org-chart',     'read',   'PERM_ORGANIZATION_ORG_CHART_READ',       FALSE)
ON CONFLICT (code) DO NOTHING;

-- Grant all permissions for all 5 default plugins to TENANT_ADMIN and TENANT_OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code IN ('TENANT_ADMIN', 'TENANT_OWNER')
  AND p.domain IN ('organization', 'catalog', 'employee', 'form', 'workflow')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- GENERAL_MANAGER role grants
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'GENERAL_MANAGER'
  AND p.code IN (
      'organization:org:read', 'organization:branch:read', 'organization:department:read',
      'organization:membership:read', 'organization:branch-access:read', 'organization:org-chart:read',
      'catalog:item:read',
      'employee:profile:read', 'employee:directory:read', 'employee:org-chart:read',
      'employee:self:read', 'employee:self:update', 'employee:change-request:read', 'employee:change-request:approve',
      'form:response:read', 'form:response:export',
      'workflow:task:action', 'workflow:instance:read', 'workflow:report:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF role grants
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'STAFF'
  AND p.code IN (
      'organization:branch:read', 'organization:department:read', 'organization:org-chart:read',
      'catalog:item:read',
      'employee:directory:read', 'employee:org-chart:read', 'employee:self:read', 'employee:self:update',
      'form:response:read',
      'workflow:task:action', 'workflow:instance:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- VIEWER role grants
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'VIEWER'
  AND p.code IN (
      'organization:branch:read', 'organization:department:read', 'organization:org-chart:read',
      'catalog:item:read',
      'employee:directory:read', 'employee:org-chart:read',
      'form:response:read',
      'workflow:instance:read', 'workflow:report:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. Schema bootstrap helpers
-- ---------------------------------------------------------------------

-- Organization structure bootstrap
CREATE OR REPLACE FUNCTION organization_bootstrap_schema(p_schema text, p_tenant_id uuid) RETURNS void AS $$
DECLARE
    v_branch_id UUID;
    v_dept_id UUID;
    v_owner_user_id UUID;
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plugin_schema_history (
            version varchar(32) PRIMARY KEY,
            description text,
            checksum varchar(80) NOT NULL,
            installed_at timestamptz NOT NULL DEFAULT now()
        )$ddl$, p_schema);

    EXECUTE format($ddl$
        INSERT INTO %I.plugin_schema_history (version, description, checksum)
        VALUES ('1.0.0', 'organization structure initial schema', 'sha256:org-struct-v1-0-0')
        ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum
    $ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_organization_branches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            code VARCHAR(32) NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(32),
            address TEXT,
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_org_branch_code UNIQUE (tenant_id, code),
            CONSTRAINT ck_org_branch_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_org_branch_default
            ON %I.plg_organization_branches (tenant_id)
            WHERE is_default;
        CREATE INDEX IF NOT EXISTS idx_org_branch_tenant_status
            ON %I.plg_organization_branches (tenant_id, status);
    $ddl$, p_schema, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_organization_departments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            branch_id UUID NOT NULL,
            parent_id UUID,
            code VARCHAR(32) NOT NULL,
            name VARCHAR(255) NOT NULL,
            manager_user_id UUID,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_org_department_code UNIQUE (tenant_id, code),
            CONSTRAINT ck_org_department_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
        );
        CREATE INDEX IF NOT EXISTS idx_org_department_tenant_branch
            ON %I.plg_organization_departments (tenant_id, branch_id);
        CREATE INDEX IF NOT EXISTS idx_org_department_tenant_parent
            ON %I.plg_organization_departments (tenant_id, parent_id);
        CREATE INDEX IF NOT EXISTS idx_org_department_tenant_manager
            ON %I.plg_organization_departments (tenant_id, manager_user_id);
    $ddl$, p_schema, p_schema, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_organization_memberships (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            user_id UUID NOT NULL,
            branch_id UUID NOT NULL,
            department_id UUID NOT NULL,
            direct_manager_user_id UUID,
            is_primary BOOLEAN NOT NULL DEFAULT FALSE,
            joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
            valid_to DATE,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_org_membership_user_dept_from UNIQUE (tenant_id, user_id, department_id, valid_from),
            CONSTRAINT ck_org_membership_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
            CONSTRAINT ck_org_membership_valid_range CHECK (valid_to IS NULL OR valid_to >= valid_from)
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_org_membership_primary
            ON %I.plg_organization_memberships (tenant_id, user_id)
            WHERE is_primary AND status = 'ACTIVE';
        CREATE INDEX IF NOT EXISTS idx_org_membership_tenant_user
            ON %I.plg_organization_memberships (tenant_id, user_id);
    $ddl$, p_schema, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_organization_branch_access (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            user_id UUID NOT NULL,
            branch_id UUID NOT NULL,
            is_primary BOOLEAN NOT NULL DEFAULT FALSE,
            can_manage BOOLEAN NOT NULL DEFAULT FALSE,
            assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
            valid_to DATE,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            CONSTRAINT uq_org_branch_access_from UNIQUE (tenant_id, user_id, branch_id, valid_from),
            CONSTRAINT ck_org_branch_access_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
            CONSTRAINT ck_org_branch_access_valid_range CHECK (valid_to IS NULL OR valid_to >= valid_from)
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_org_branch_access_primary
            ON %I.plg_organization_branch_access (tenant_id, user_id)
            WHERE is_primary AND status = 'ACTIVE';
    $ddl$, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_organization_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            entity_type VARCHAR(32) NOT NULL,
            entity_id UUID NOT NULL,
            action VARCHAR(32) NOT NULL,
            actor_user_id UUID,
            changes JSONB,
            recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_org_history_tenant_entity
            ON %I.plg_organization_history (tenant_id, entity_type, entity_id);
    $ddl$, p_schema, p_schema);

    -- Seed default HQ branch and GENERAL department if table is empty
    EXECUTE format('SELECT id FROM %I.plg_organization_branches WHERE is_default = TRUE LIMIT 1', p_schema)
        INTO v_branch_id;

    IF v_branch_id IS NULL THEN
        EXECUTE format($ins$
            INSERT INTO %I.plg_organization_branches (tenant_id, code, name, is_default, status)
            VALUES (%L, 'HQ', 'Trụ sở chính', TRUE, 'ACTIVE')
            RETURNING id
        $ins$, p_schema, p_tenant_id) INTO v_branch_id;

        EXECUTE format($ins$
            INSERT INTO %I.plg_organization_departments (tenant_id, branch_id, code, name, status)
            VALUES (%L, %L, 'GENERAL', 'Phòng Tổng hợp', 'ACTIVE')
            RETURNING id
        $ins$, p_schema, p_tenant_id, v_branch_id) INTO v_dept_id;

        -- Assign tenant owner/admin as primary member
        SELECT user_id INTO v_owner_user_id
        FROM user_tenants
        WHERE tenant_id = p_tenant_id
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_owner_user_id IS NOT NULL THEN
            EXECUTE format($ins$
                INSERT INTO %I.plg_organization_memberships (tenant_id, user_id, branch_id, department_id, is_primary, status)
                VALUES (%L, %L, %L, %L, TRUE, 'ACTIVE')
                ON CONFLICT DO NOTHING
            $ins$, p_schema, p_tenant_id, v_owner_user_id, v_branch_id, v_dept_id);

            EXECUTE format($ins$
                INSERT INTO %I.plg_organization_branch_access (tenant_id, user_id, branch_id, is_primary, can_manage, status)
                VALUES (%L, %L, %L, TRUE, TRUE, 'ACTIVE')
                ON CONFLICT DO NOTHING
            $ins$, p_schema, p_tenant_id, v_owner_user_id, v_branch_id);
        END IF;
    END IF;
END $$ LANGUAGE plpgsql;

-- Catalog bootstrap
CREATE OR REPLACE FUNCTION catalog_bootstrap_schema_v8(p_schema text) RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plugin_schema_history (
            version varchar(32) PRIMARY KEY,
            description text,
            checksum varchar(80) NOT NULL,
            installed_at timestamptz NOT NULL DEFAULT now()
        )$ddl$, p_schema);

    EXECUTE format($ddl$
        INSERT INTO %I.plugin_schema_history (version, description, checksum)
        VALUES ('1.0.0', 'catalog schema', 'sha256:catalog-v1-0-0')
        ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum
    $ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_types (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            code VARCHAR(64) NOT NULL,
            name_key VARCHAR(128) NOT NULL,
            description_key VARCHAR(255),
            hierarchy_mode VARCHAR(16) NOT NULL DEFAULT 'FLAT',
            allowed_relations TEXT[] NOT NULL DEFAULT '{}',
            allowed_parent_types TEXT[] NOT NULL DEFAULT '{}',
            max_depth INT NOT NULL DEFAULT 1,
            min_parents INT NOT NULL DEFAULT 0,
            allow_free_text BOOLEAN NOT NULL DEFAULT FALSE,
            versioned BOOLEAN NOT NULL DEFAULT FALSE,
            effective_dated BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
            attributes_schema JSONB,
            system_type_id UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_catalog_types_code UNIQUE NULLS NOT DISTINCT (tenant_id, code)
        );
        CREATE INDEX IF NOT EXISTS idx_catalog_types_tenant_status
            ON %I.catalog_types (tenant_id, status);
    $ddl$, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            type_id UUID NOT NULL REFERENCES %I.catalog_types(id) ON DELETE CASCADE,
            version_group_id UUID NOT NULL DEFAULT gen_random_uuid(),
            version INT NOT NULL DEFAULT 1,
            code VARCHAR(64) NOT NULL,
            name VARCHAR(255) NOT NULL,
            name_en VARCHAR(255),
            description TEXT,
            sort_order INT NOT NULL DEFAULT 0,
            status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
            valid_from TIMESTAMPTZ,
            valid_to TIMESTAMPTZ,
            supersedes_item_id UUID,
            attributes JSONB,
            system_item_id UUID,
            created_by UUID,
            updated_by UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_catalog_items_code UNIQUE NULLS NOT DISTINCT (tenant_id, type_id, code, version)
        );
        CREATE INDEX IF NOT EXISTS idx_catalog_items_tenant_type
            ON %I.catalog_items (tenant_id, type_id, status);
    $ddl$, p_schema, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_item_edges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            parent_item_id UUID NOT NULL REFERENCES %I.catalog_items(id) ON DELETE CASCADE,
            child_item_id UUID NOT NULL REFERENCES %I.catalog_items(id) ON DELETE CASCADE,
            relation_type VARCHAR(64) NOT NULL DEFAULT 'PARENT_OF',
            sort_order INT NOT NULL DEFAULT 0,
            status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
            valid_from TIMESTAMPTZ,
            valid_to TIMESTAMPTZ,
            system_edge_id UUID,
            created_by UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_catalog_edges UNIQUE NULLS NOT DISTINCT (tenant_id, parent_item_id, child_item_id, relation_type)
        );
    $ddl$, p_schema, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_type_grants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            type_id UUID NOT NULL REFERENCES %I.catalog_types(id) ON DELETE CASCADE,
            role_code VARCHAR(64) NOT NULL,
            can_read BOOLEAN NOT NULL DEFAULT TRUE,
            can_write BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_catalog_type_grants UNIQUE (tenant_id, type_id, role_code)
        );
    $ddl$, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.catalog_type_relations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            parent_type_id UUID NOT NULL REFERENCES %I.catalog_types(id) ON DELETE CASCADE,
            child_type_id UUID NOT NULL REFERENCES %I.catalog_types(id) ON DELETE CASCADE,
            relation_type VARCHAR(64) NOT NULL DEFAULT 'PARENT_OF',
            sort_order INT NOT NULL DEFAULT 0,
            status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
            system_relation_id UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_catalog_type_relations UNIQUE NULLS NOT DISTINCT (tenant_id, parent_type_id, child_type_id, relation_type)
        );
    $ddl$, p_schema, p_schema, p_schema);
END $$ LANGUAGE plpgsql;

-- Employee bootstrap
CREATE OR REPLACE FUNCTION employee_bootstrap_schema_v8(p_schema text) RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plugin_schema_history (
            version varchar(32) PRIMARY KEY,
            description text,
            checksum varchar(80) NOT NULL,
            installed_at timestamptz NOT NULL DEFAULT now()
        )$ddl$, p_schema);

    EXECUTE format($ddl$
        INSERT INTO %I.plugin_schema_history (version, description, checksum)
        VALUES ('1.0.0', 'employee schema', 'sha256:employee-v1-0-0')
        ON CONFLICT (version) DO UPDATE SET checksum = EXCLUDED.checksum
    $ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_employee_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            employee_code VARCHAR(32) NOT NULL,
            user_id UUID,
            status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
            employee_type VARCHAR(32) NOT NULL DEFAULT 'EMPLOYEE',
            full_name VARCHAR(255) NOT NULL,
            photo_url TEXT,
            date_of_birth DATE,
            gender VARCHAR(16),
            nationality VARCHAR(64),
            marital_status VARCHAR(32),
            national_id VARCHAR(32),
            national_id_issue_date DATE,
            national_id_issue_place VARCHAR(255),
            tax_code VARCHAR(32),
            social_insurance_no VARCHAR(32),
            health_insurance_no VARCHAR(32),
            personal_email VARCHAR(255),
            work_email VARCHAR(255),
            phone VARCHAR(32),
            current_address TEXT,
            permanent_address TEXT,
            emergency_contact_name VARCHAR(255),
            emergency_contact_relationship VARCHAR(64),
            emergency_contact_phone VARCHAR(32),
            education_level VARCHAR(64),
            school VARCHAR(255),
            major VARCHAR(255),
            graduation_year INTEGER,
            notes TEXT,
            scope_sync_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            archived_at TIMESTAMP WITH TIME ZONE,
            version BIGINT NOT NULL DEFAULT 0,
            CONSTRAINT uq_employee_profile_code UNIQUE (tenant_id, employee_code)
        );
        CREATE INDEX IF NOT EXISTS idx_employee_profile_tenant_status
            ON %I.plg_employee_profiles (tenant_id, status);
        CREATE INDEX IF NOT EXISTS idx_employee_profile_tenant_user
            ON %I.plg_employee_profiles (tenant_id, user_id);
    $ddl$, p_schema, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_employee_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            branch_id UUID NOT NULL,
            department_id UUID NOT NULL,
            position_title VARCHAR(255),
            job_level VARCHAR(64),
            direct_manager_user_id UUID,
            is_primary BOOLEAN NOT NULL DEFAULT FALSE,
            valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
            valid_to DATE,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_emp_assignment_tenant_emp
            ON %I.plg_employee_assignments (tenant_id, employee_id);
    $ddl$, p_schema, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_employee_contracts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            contract_number VARCHAR(64) NOT NULL,
            contract_type VARCHAR(32) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            sign_date DATE,
            start_date DATE NOT NULL,
            end_date DATE,
            salary_amount NUMERIC(15, 2),
            salary_currency VARCHAR(8) DEFAULT 'VND',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    $ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_employee_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            document_type VARCHAR(64) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_url TEXT NOT NULL,
            file_size BIGINT,
            mime_type VARCHAR(128),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    $ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_employee_change_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            employee_id UUID NOT NULL,
            requester_user_id UUID NOT NULL,
            change_type VARCHAR(64) NOT NULL,
            proposed_changes JSONB NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
            workflow_instance_id UUID,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    $ddl$, p_schema);

    EXECUTE format($ddl$
        CREATE TABLE IF NOT EXISTS %I.plg_employee_approval_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            scope_type VARCHAR(32) NOT NULL DEFAULT 'TENANT',
            scope_id UUID,
            field_group VARCHAR(64) NOT NULL,
            step_no INT NOT NULL,
            approver_type VARCHAR(32) NOT NULL,
            approver_id UUID,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    $ddl$, p_schema);
END $$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 5. Tenant backfill loop
-- ---------------------------------------------------------------------
DO $$
DECLARE
    t RECORD;
    v_short_id TEXT;
    v_cat_schema TEXT;
    v_org_schema TEXT;
    v_emp_schema TEXT;
    v_form_schema TEXT;
    v_wf_schema TEXT;
BEGIN
    FOR t IN SELECT id FROM tenants WHERE id <> '00000000-0000-0000-0000-000000000001' LOOP
        v_short_id := substr(replace(t.id::text, '-', ''), 1, 8);
        v_cat_schema  := 'tenant_' || v_short_id || '_catalog';
        v_org_schema  := 'tenant_' || v_short_id || '_org_structure';
        v_emp_schema  := 'tenant_' || v_short_id || '_employee';
        v_form_schema := 'tenant_' || v_short_id || '_form';
        v_wf_schema   := 'tenant_' || v_short_id || '_workflow';

        PERFORM catalog_bootstrap_schema_v8(v_cat_schema);
        PERFORM organization_bootstrap_schema(v_org_schema, t.id);
        PERFORM employee_bootstrap_schema_v8(v_emp_schema);

        -- Upsert tenant_plugins for catalog
        INSERT INTO tenant_plugins (
            tenant_id, catalog_id, plugin_key, status, storage_model,
            storage_schema, installed_version, deploy_ref, installed_at, activated_at
        )
        SELECT t.id, c.id, 'catalog', 'ACTIVE', 'DEDICATED_SCHEMA',
               v_cat_schema, '1.0.0', '{"runtime":"docker","deployment":"openerp-plugin-catalog-1-0-0","service":"openerp-plugin-catalog-1-0-0","healthy":true}'::jsonb, now(), now()
        FROM plugin_catalog c WHERE c.plugin_key = 'catalog'
        ON CONFLICT (tenant_id, plugin_key) DO UPDATE
            SET status = 'ACTIVE',
                storage_model = 'DEDICATED_SCHEMA',
                storage_schema = EXCLUDED.storage_schema,
                installed_version = COALESCE(tenant_plugins.installed_version, EXCLUDED.installed_version),
                activated_at = COALESCE(tenant_plugins.activated_at, now()),
                updated_at = now();

        -- Upsert tenant_plugins for org-structure
        INSERT INTO tenant_plugins (
            tenant_id, catalog_id, plugin_key, status, storage_model,
            storage_schema, installed_version, deploy_ref, installed_at, activated_at
        )
        SELECT t.id, c.id, 'org-structure', 'ACTIVE', 'DEDICATED_SCHEMA',
               v_org_schema, '1.1.3', '{"runtime":"docker","deployment":"openerp-plugin-organization-1-1-3","service":"openerp-plugin-organization-1-1-3","healthy":true}'::jsonb, now(), now()
        FROM plugin_catalog c WHERE c.plugin_key = 'org-structure'
        ON CONFLICT (tenant_id, plugin_key) DO UPDATE
            SET status = 'ACTIVE',
                storage_model = 'DEDICATED_SCHEMA',
                storage_schema = EXCLUDED.storage_schema,
                installed_version = COALESCE(tenant_plugins.installed_version, EXCLUDED.installed_version),
                activated_at = COALESCE(tenant_plugins.activated_at, now()),
                updated_at = now();

        -- Upsert tenant_plugins for employee
        INSERT INTO tenant_plugins (
            tenant_id, catalog_id, plugin_key, status, storage_model,
            storage_schema, installed_version, deploy_ref, installed_at, activated_at
        )
        SELECT t.id, c.id, 'employee', 'ACTIVE', 'DEDICATED_SCHEMA',
               v_emp_schema, '1.2.2', '{"runtime":"docker","deployment":"openerp-plugin-employee-1-2-2","service":"openerp-plugin-employee-1-2-2","healthy":true}'::jsonb, now(), now()
        FROM plugin_catalog c WHERE c.plugin_key = 'employee'
        ON CONFLICT (tenant_id, plugin_key) DO UPDATE
            SET status = 'ACTIVE',
                storage_model = 'DEDICATED_SCHEMA',
                storage_schema = EXCLUDED.storage_schema,
                installed_version = COALESCE(tenant_plugins.installed_version, EXCLUDED.installed_version),
                activated_at = COALESCE(tenant_plugins.activated_at, now()),
                updated_at = now();

        -- Upsert tenant_plugins for form
        INSERT INTO tenant_plugins (
            tenant_id, catalog_id, plugin_key, status, storage_model,
            storage_schema, installed_version, deploy_ref, installed_at, activated_at
        )
        SELECT t.id, c.id, 'form', 'ACTIVE', 'DEDICATED_SCHEMA',
               v_form_schema, '1.0.8', '{"runtime":"docker","deployment":"openerp-plugin-form-1-0-8","service":"openerp-plugin-form-1-0-8","healthy":true}'::jsonb, now(), now()
        FROM plugin_catalog c WHERE c.plugin_key = 'form'
        ON CONFLICT (tenant_id, plugin_key) DO UPDATE
            SET status = 'ACTIVE',
                storage_model = 'DEDICATED_SCHEMA',
                storage_schema = EXCLUDED.storage_schema,
                installed_version = COALESCE(tenant_plugins.installed_version, EXCLUDED.installed_version),
                activated_at = COALESCE(tenant_plugins.activated_at, now()),
                updated_at = now();

        -- Upsert tenant_plugins for workflow
        INSERT INTO tenant_plugins (
            tenant_id, catalog_id, plugin_key, status, storage_model,
            storage_schema, installed_version, deploy_ref, installed_at, activated_at
        )
        SELECT t.id, c.id, 'workflow', 'ACTIVE', 'DEDICATED_SCHEMA',
               v_wf_schema, '1.0.13', '{"runtime":"docker","deployment":"openerp-plugin-workflow-1-0-13","service":"openerp-plugin-workflow-1-0-13","healthy":true}'::jsonb, now(), now()
        FROM plugin_catalog c WHERE c.plugin_key = 'workflow'
        ON CONFLICT (tenant_id, plugin_key) DO UPDATE
            SET status = 'ACTIVE',
                storage_model = 'DEDICATED_SCHEMA',
                storage_schema = EXCLUDED.storage_schema,
                installed_version = COALESCE(tenant_plugins.installed_version, EXCLUDED.installed_version),
                activated_at = COALESCE(tenant_plugins.activated_at, now()),
                updated_at = now();

        -- Backfill allowed_plugins with all 5 default plugins
        UPDATE tenants
        SET allowed_plugins = (
            SELECT jsonb_agg(DISTINCT elem)
            FROM jsonb_array_elements(
                COALESCE(allowed_plugins, '["core"]'::jsonb) || '["catalog", "org-structure", "employee", "form", "workflow"]'::jsonb
            ) AS elem
        )
        WHERE id = t.id;
    END LOOP;
END $$;

DROP FUNCTION IF EXISTS organization_bootstrap_schema(text, uuid);
DROP FUNCTION IF EXISTS catalog_bootstrap_schema_v8(text);
DROP FUNCTION IF EXISTS employee_bootstrap_schema_v8(text);
`;

writeFileSync('src/backend/src/main/resources/db/migration/V8.0.1__default_locked_plugins_and_dependencies.sql', sql, 'utf8');
console.log('Successfully generated V8.0.1__default_locked_plugins_and_dependencies.sql');

