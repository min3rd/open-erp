-- V5.0.1: catalog is a system default plugin, not a locked mandatory plugin.
-- It stays default_install = TRUE so every tenant sees it in plugin management;
-- tenants may enable/disable/uninstall it just like any other plugin.
UPDATE plugin_catalog
SET default_install = TRUE,
    locked = FALSE,
    updated_at = now()
WHERE plugin_key = 'catalog';
