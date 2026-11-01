-- Sprint 07 / ADR-S07-002 step C6: the big-bang organization cutover completes.
-- The org-structure plugin (always-on, locked) is the single owner of branch /
-- department / access-membership master data. Core keeps only the scope
-- projection (core_user_scope, core_user_manager_edge, core_department_closure).
--
-- 1. org-structure becomes a locked default-install plugin so every new tenant
--    is provisioned by the plugin bootstrap seeder (HQ/GENERAL + owner membership).
-- 2. The legacy core:* organization permissions are removed (V7.0.1 mapped
--    consumers to the organization:* namespace; no runtime alias is kept).
-- 3. The legacy Core organization tables are dropped. Their data was copied to
--    the plugin schema by scripts/ops/org-cutover.mjs (backup/copy/verify) per
--    docs/07_deployment_guides/org_cutover_runbook.md before this migration.

UPDATE plugin_catalog
SET default_install = TRUE,
    locked = TRUE
WHERE plugin_key = 'org-structure'
  AND (default_install = FALSE OR locked = FALSE);

DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions
    WHERE domain = 'core'
      AND resource IN ('organization', 'branch', 'department', 'membership', 'branch-assignment'));

DELETE FROM permissions
WHERE domain = 'core'
  AND resource IN ('organization', 'branch', 'department', 'membership', 'branch-assignment');

DROP TABLE IF EXISTS user_branch_assignments CASCADE;
DROP TABLE IF EXISTS user_department_memberships CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
