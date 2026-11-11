-- =====================================================================
-- V9.0.0: Sprint 09 - Attendance & Timesheet Plugin Registration
-- 1. plugin_catalog entry for attendance (default_install=TRUE, locked=FALSE, catalog_status=ACTIVE)
-- 2. plugin_versions entry (PUBLISHED) with full manifest & UI manifest
-- 3. permissions & role_permissions seed for system roles
-- 4. Backfill tenants.allowed_plugins & tenant_plugins (ACTIVE)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Plugin catalog: attendance plugin
-- ---------------------------------------------------------------------
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility,
                            default_install, locked, is_core, catalog_status)
VALUES
    ('attendance', 'PLUGIN_ATTENDANCE_TITLE', 'PLUGIN_ATTENDANCE_SUBTITLE', 'PLATFORM', TRUE, FALSE, FALSE, 'ACTIVE')
ON CONFLICT (plugin_key) DO UPDATE
    SET name_key = EXCLUDED.name_key,
        description_key = EXCLUDED.description_key,
        visibility = 'PLATFORM',
        default_install = TRUE,
        locked = FALSE,
        is_core = FALSE,
        catalog_status = 'ACTIVE',
        updated_at = now();

-- ---------------------------------------------------------------------
-- 2. Plugin versions: 1.0.0 published entry
-- ---------------------------------------------------------------------
INSERT INTO plugin_versions (
    catalog_id, version, release_status, core_compatibility, dependencies,
    platforms, permissions, entities, ui_manifest, distribution, manifest,
    migration_policy, rollback_strategy, template_version, created_at,
    published_at, publish_reason
)
SELECT c.id, '1.0.0', 'PUBLISHED', '>=1.0.0 <2.0.0',
       '[{"key": "catalog", "min_version": "1.0.0"}, {"key": "org-structure", "min_version": "1.1.0"}, {"key": "employee", "min_version": "1.0.0"}, {"key": "workflow", "min_version": "1.0.0"}]'::jsonb,
       '{"desktop":{"supported":true,"features":["attendance:punch","attendance:schedule:view","attendance:request:create","attendance:request:approve","attendance:timesheet:manage","attendance:kiosk"]},"mobile":{"supported":true,"features":["attendance:punch","attendance:schedule:view","attendance:request:create","attendance:request:approve","attendance:timesheet:confirm"]}}'::jsonb,
       '[{"code":"attendance:read","name":"Attendance read"},{"code":"attendance:punch","name":"Attendance punch"},{"code":"attendance:request:create","name":"Attendance request create"},{"code":"attendance:request:approve","name":"Attendance request approve"},{"code":"attendance:timesheet:manage","name":"Attendance timesheet manage"},{"code":"attendance:leave:manage","name":"Attendance leave manage"},{"code":"attendance:kiosk","name":"Attendance kiosk"}]'::jsonb,
       '[]'::jsonb,
       '{"contract_version":"1.0","screens":[{"route":"/apps/attendance","title_key":"PLUGIN_ATTENDANCE_TITLE","permission":"attendance:read","render_mode":"WEB_COMPONENT","entry":"/plugins-runtime/attendance/main.js","tag_name":"op-attendance-app","order":140,"platforms":["desktop","mobile"]}],"contributions":[],"slots":[],"crud":[]}'::jsonb,
       '{"type":"IMAGE_REGISTRY","registry_url":"","repository":"open-erp/attendance","tag":"1.0.0"}'::jsonb,
       '{"schema_version":"2.0","id":"attendance","name":"Attendance & Timesheet","description":"Chấm công đa nguồn, tính công tự động, quản lý ca kíp, đơn từ, sổ cái nghỉ phép và bảng công kỳ 4 bước.","version":"1.0.0","template_version":"2.0.0","author":"Open-ERP Plugin Team","core_version_compatibility":">=1.0.0 <2.0.0","migration_policy":"COMPATIBLE","rollback_strategy":"SNAPSHOT_RESTORE","dependencies":[{"key":"catalog","min_version":"1.0.0"},{"key":"org-structure","min_version":"1.1.0"},{"key":"employee","min_version":"1.0.0"},{"key":"workflow","min_version":"1.0.0"}],"platforms":{"desktop":{"supported":true,"features":["attendance:punch","attendance:schedule:view","attendance:request:create","attendance:request:approve","attendance:timesheet:manage","attendance:kiosk"]},"mobile":{"supported":true,"features":["attendance:punch","attendance:schedule:view","attendance:request:create","attendance:request:approve","attendance:timesheet:confirm"]}},"permissions":[{"code":"attendance:read","name":"Attendance read"},{"code":"attendance:punch","name":"Attendance punch"},{"code":"attendance:request:create","name":"Attendance request create"},{"code":"attendance:request:approve","name":"Attendance request approve"},{"code":"attendance:timesheet:manage","name":"Attendance timesheet manage"},{"code":"attendance:leave:manage","name":"Attendance leave manage"},{"code":"attendance:kiosk","name":"Attendance kiosk"}],"ui_manifest":{"contract_version":"1.0","screens":[{"route":"/apps/attendance","title_key":"PLUGIN_ATTENDANCE_TITLE","permission":"attendance:read","render_mode":"WEB_COMPONENT","entry":"/plugins-runtime/attendance/main.js","tag_name":"op-attendance-app","order":140,"platforms":["desktop","mobile"]}],"contributions":[],"slots":[],"crud":[]}}'::jsonb,
       'COMPATIBLE', 'SNAPSHOT_RESTORE', '2.0.0', now(), now(),
       'Sprint 09 Attendance & Timesheet plugin'
FROM plugin_catalog c
WHERE c.plugin_key = 'attendance'
ON CONFLICT (catalog_id, version) DO UPDATE
    SET release_status = 'PUBLISHED',
        dependencies = EXCLUDED.dependencies,
        platforms = EXCLUDED.platforms,
        permissions = EXCLUDED.permissions,
        ui_manifest = EXCLUDED.ui_manifest,
        distribution = EXCLUDED.distribution,
        manifest = EXCLUDED.manifest,
        published_at = now(),
        publish_reason = 'Sprint 09 Attendance & Timesheet plugin';

-- ---------------------------------------------------------------------
-- 3. Seed permissions & role_permissions for system roles
-- ---------------------------------------------------------------------
INSERT INTO permissions (code, domain, resource, action, description_key, is_system) VALUES
    ('attendance:read',             'attendance', 'attendance', 'read',    'PERM_ATTENDANCE_READ',             FALSE),
    ('attendance:punch',            'attendance', 'punch',      'create',  'PERM_ATTENDANCE_PUNCH',            FALSE),
    ('attendance:request:create',   'attendance', 'request',    'create',  'PERM_ATTENDANCE_REQUEST_CREATE',   FALSE),
    ('attendance:request:approve',  'attendance', 'request',    'manage',  'PERM_ATTENDANCE_REQUEST_APPROVE',  FALSE),
    ('attendance:timesheet:manage', 'attendance', 'timesheet',  'manage',  'PERM_ATTENDANCE_TIMESHEET_MANAGE', FALSE),
    ('attendance:leave:manage',     'attendance', 'leave',      'manage',  'PERM_ATTENDANCE_LEAVE_MANAGE',     FALSE),
    ('attendance:kiosk',            'attendance', 'kiosk',      'manage',  'PERM_ATTENDANCE_KIOSK',            FALSE)
ON CONFLICT (code) DO NOTHING;

-- Grant all permissions to TENANT_ADMIN and TENANT_OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code IN ('TENANT_ADMIN', 'TENANT_OWNER')
  AND p.domain = 'attendance'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- GENERAL_MANAGER role grants
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.tenant_id IS NULL
  AND r.code = 'GENERAL_MANAGER'
  AND p.code IN (
      'attendance:read', 'attendance:punch', 'attendance:request:create',
      'attendance:request:approve', 'attendance:timesheet:manage', 'attendance:leave:manage'
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
      'attendance:read', 'attendance:punch', 'attendance:request:create'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. Backfill tenant_plugins and tenants.allowed_plugins for existing tenants
-- ---------------------------------------------------------------------
INSERT INTO tenant_plugins (
    tenant_id, catalog_id, plugin_key, status, storage_model,
    storage_schema, installed_version, deploy_ref, installed_at, activated_at
)
SELECT t.id, c.id, 'attendance', 'ACTIVE', 'DEDICATED_SCHEMA',
       'public', '1.0.0', '{"runtime":"quarkus","service":"plugin-attendance-1-0-0","healthy":true}'::jsonb, now(), now()
FROM tenants t
CROSS JOIN plugin_catalog c
WHERE c.plugin_key = 'attendance'
ON CONFLICT (tenant_id, plugin_key) DO UPDATE
    SET status = 'ACTIVE',
        storage_model = 'DEDICATED_SCHEMA',
        installed_version = COALESCE(tenant_plugins.installed_version, EXCLUDED.installed_version),
        activated_at = COALESCE(tenant_plugins.activated_at, now()),
        updated_at = now();

UPDATE tenants
SET allowed_plugins = (
    SELECT jsonb_agg(DISTINCT elem)
    FROM jsonb_array_elements(
        COALESCE(allowed_plugins, '["core"]'::jsonb) || '["attendance"]'::jsonb
    ) AS elem
);
