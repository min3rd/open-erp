-- Dev-only bridge: bind tenant and system catalog ledgers to the static
-- catalog plugin containers. Production uses the deployer instead.
UPDATE tenant_plugins
SET deploy_ref = '{"runtime":"docker","deployment":"openerp-catalog-dev","service":"openerp-catalog-dev","healthy":true}'::jsonb,
    storage_schema = 'tenant_cd2729d8_catalog',
    installed_version = '1.0.0',
    status = 'ACTIVE',
    updated_at = now()
WHERE tenant_id = 'cd2729d8-aec0-423c-b2b0-2649a97d822f'
  AND plugin_key = 'catalog';

UPDATE tenant_plugins
SET deploy_ref = '{"runtime":"docker","deployment":"openerp-catalog-system-dev","service":"openerp-catalog-system-dev","healthy":true}'::jsonb,
    storage_schema = 'tenant_00000000_catalog',
    installed_version = '1.0.0',
    status = 'ACTIVE',
    updated_at = now()
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND plugin_key = 'catalog';
