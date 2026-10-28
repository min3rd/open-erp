-- Dev-only bridge: bind the system catalog ledger to the static platform
-- container. Tenant ledgers are now managed by the version deployer
-- (TASK-406), so they are no longer pinned to static dev containers here.
UPDATE tenant_plugins
SET deploy_ref = '{"runtime":"docker","deployment":"openerp-catalog-system-dev","service":"openerp-catalog-system-dev","healthy":true}'::jsonb,
    storage_schema = 'tenant_00000000_catalog',
    installed_version = '1.0.0',
    status = 'ACTIVE',
    updated_at = now()
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND plugin_key = 'catalog';
