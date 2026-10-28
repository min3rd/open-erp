-- V5.2.0: P5 - catalog plugin declares its schema migration bundle
UPDATE plugin_versions pv
SET manifest = jsonb_set(pv.manifest, '{migrations}', $migrations$[{"version":"1.0.0","file":"V1.0.0__initial_schema.sql","checksum":"sha256:fba82cb293fc1d071f3713fb856935f554d66e2687fc2ae410b82e77f6fce9c4","description":"catalog schema"}]$migrations$::jsonb, true)
FROM plugin_catalog pc
WHERE pv.catalog_id = pc.id
  AND pc.plugin_key = 'catalog'
  AND pv.version = '1.0.0';
