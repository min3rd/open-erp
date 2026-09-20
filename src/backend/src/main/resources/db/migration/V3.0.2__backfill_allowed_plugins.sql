-- =====================================================================
-- V3.0.2: Sprint 03 - Backfill tenant entitlements into tenant_plugins
-- DES-03-DB section 4 / TASK-301 / BUG-84
-- PostgreSQL 16+, schema public. All statements are idempotent.
--
-- Ordering guarantee: schema (V3.0.0) -> catalog seed (V3.0.1) -> backfill.
-- This migration is ALSO self-sufficient: it creates placeholder catalog
-- entries for any allowed key that is still missing before joining.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Report keys that will be created as placeholder catalog entries
-- ---------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT DISTINCT k.plugin_key
        FROM tenants t
        CROSS JOIN LATERAL jsonb_array_elements_text(t.allowed_plugins) AS k(plugin_key)
        LEFT JOIN plugin_catalog c ON c.plugin_key = k.plugin_key
        WHERE k.plugin_key <> 'core' AND c.id IS NULL
    LOOP
        RAISE NOTICE 'PLUGIN-BACKFILL: creating placeholder catalog for key %', r.plugin_key;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 1. Ensure every entitled key has a catalog entry (placeholder fallback)
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
-- 2. Backfill entitlements as NOT_INSTALLED rows (idempotent)
-- ---------------------------------------------------------------------
INSERT INTO tenant_plugins (tenant_id, catalog_id, plugin_key, status)
SELECT t.id, c.id, c.plugin_key, 'NOT_INSTALLED'
FROM tenants t
CROSS JOIN LATERAL jsonb_array_elements_text(t.allowed_plugins) AS k(plugin_key)
JOIN plugin_catalog c ON c.plugin_key = k.plugin_key
WHERE k.plugin_key <> 'core'
ON CONFLICT (tenant_id, plugin_key) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. Fail-fast verification: per-tenant/per-key reconciliation (BUG-84)
-- ---------------------------------------------------------------------
DO $$
DECLARE v_missing INT;
BEGIN
    WITH expected AS (
        SELECT t.id AS tenant_id, k.plugin_key
        FROM tenants t
        CROSS JOIN LATERAL jsonb_array_elements_text(t.allowed_plugins) AS k(plugin_key)
        WHERE k.plugin_key <> 'core'
    )
    SELECT count(*) INTO v_missing
    FROM expected e
    LEFT JOIN tenant_plugins tp
      ON tp.tenant_id = e.tenant_id AND tp.plugin_key = e.plugin_key
    WHERE tp.id IS NULL;

    IF v_missing > 0 THEN
        RAISE EXCEPTION 'PLUGIN-BACKFILL verification failed: % missing entitlements', v_missing;
    END IF;
END $$;
