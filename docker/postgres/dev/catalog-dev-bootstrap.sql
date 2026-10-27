-- Dev-only bridge: bind the minhvv tenant's catalog ledger to the static
-- catalog-plugin-dev container. Production runs the deployer instead.
UPDATE tenant_plugins
SET deploy_ref = '{"runtime":"docker","deployment":"openerp-catalog-dev","service":"openerp-catalog-dev","healthy":true}'::jsonb,
    storage_schema = 'tenant_cd2729d8_catalog',
    installed_version = '1.0.0',
    status = 'ACTIVE',
    updated_at = now()
WHERE tenant_id = 'cd2729d8-aec0-423c-b2b0-2649a97d822f'
  AND plugin_key = 'catalog';
