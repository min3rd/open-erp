-- =====================================================================
-- V3.0.1: Sprint 03 - Seed plugin catalog BEFORE entitlement backfill
-- DES-03-DB section 4 / TASK-301 / BUG-84
-- PostgreSQL 16+, schema public. All statements are idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Placeholder catalog for every key present in tenants.allowed_plugins
--    (prevents entitlement loss when V3.0.2 backfill joins on plugin_catalog)
-- ---------------------------------------------------------------------
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility)
SELECT DISTINCT
       k.plugin_key,
       'PLUGIN_' || upper(replace(replace(k.plugin_key, '-', '_'), '.', '_')) || '_NAME',
       'PLUGIN_' || upper(replace(replace(k.plugin_key, '-', '_'), '.', '_')) || '_DESCRIPTION',
       'PLATFORM'
FROM tenants t
CROSS JOIN LATERAL jsonb_array_elements_text(t.allowed_plugins) AS k(plugin_key)
WHERE k.plugin_key <> 'core'
ON CONFLICT (plugin_key) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Official plugin catalog entries (DRAFT, no versions yet)
-- ---------------------------------------------------------------------
INSERT INTO plugin_catalog (plugin_key, name_key, description_key, visibility, entitlement_plans)
VALUES
    ('sales',      'PLUGIN_SALES_NAME',      'PLUGIN_SALES_DESCRIPTION',      'PLATFORM', '["STANDARD", "ENTERPRISE"]'::jsonb),
    ('inventory',  'PLUGIN_INVENTORY_NAME',  'PLUGIN_INVENTORY_DESCRIPTION',  'PLATFORM', '["STANDARD", "ENTERPRISE"]'::jsonb),
    ('accounting', 'PLUGIN_ACCOUNTING_NAME', 'PLUGIN_ACCOUNTING_DESCRIPTION', 'PLATFORM', '["STANDARD", "ENTERPRISE"]'::jsonb),
    ('crm',        'PLUGIN_CRM_NAME',        'PLUGIN_CRM_DESCRIPTION',        'PLATFORM', '["STANDARD", "ENTERPRISE"]'::jsonb)
ON CONFLICT (plugin_key) DO NOTHING;
