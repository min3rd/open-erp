package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Tenant provisioning hook for system-default plugins (TASK-307 / Gate Q5):
 * new tenants automatically receive every catalog entry marked
 * {@code default_install}. Locked defaults go through the normal install saga
 * (datasource, deploy, health, permissions, entities) in topological dependency
 * order; optional defaults are only entitled (NOT_INSTALLED) for the tenant admin
 * to enable.
 */
@ApplicationScoped
public class PluginProvisioningService {

    private static final Logger LOG = Logger.getLogger(PluginProvisioningService.class);

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    PluginEntitlementService entitlementService;

    @Inject
    PluginLifecycleService lifecycleService;

    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "openerp.platform.system-tenant-id",
            defaultValue = "00000000-0000-0000-0000-000000000001")
    String systemTenantId;

    @Transactional
    public int provisionDefaults(UUID tenantId) {
        if (tenantId == null || tenantId.toString().equals(systemTenantId)) {
            return 0;
        }
        List<PluginCatalog> defaults = catalogRepository.listDefaultInstall().stream()
                .filter(catalog -> catalog.catalogStatus == PluginCatalogStatus.ACTIVE)
                .toList();

        List<PluginCatalog> sorted = sortInDependencyOrder(defaults);
        int provisioned = 0;
        for (PluginCatalog catalog : sorted) {
            try {
                if (!entitlementService.grantIfExists(tenantId, catalog.pluginKey)) {
                    continue;
                }
                ensureAllowedPlugin(tenantId, catalog.pluginKey);
                if (catalog.locked) {
                    lifecycleService.install(tenantId, catalog.pluginKey, null, null);
                }
                provisioned++;
            } catch (RuntimeException e) {
                LOG.warnf("Default plugin %s provisioning failed for tenant %s: %s",
                        catalog.pluginKey, tenantId, e.getMessage());
            }
        }
        return provisioned;
    }

    /**
     * Topologically sorts default plugins so dependencies are installed before
     * dependent plugins (e.g. catalog & org-structure before employee).
     */
    List<PluginCatalog> sortInDependencyOrder(List<PluginCatalog> catalogs) {
        if (catalogs.size() <= 1) {
            return catalogs;
        }
        Map<String, PluginCatalog> byKey = new LinkedHashMap<>();
        Map<String, Set<String>> depsByKey = new HashMap<>();

        for (PluginCatalog cat : catalogs) {
            byKey.put(cat.pluginKey, cat);
            Set<String> deps = new HashSet<>();
            List<PluginVersion> versions = versionRepository.listInstallable(cat.id);
            if (!versions.isEmpty()) {
                PluginVersion ver = versions.get(0);
                if (ver.dependencies != null && ver.dependencies.isArray()) {
                    for (JsonNode dep : ver.dependencies) {
                        String key = dep.isTextual() ? dep.asText() : dep.path("key").asText(null);
                        if (key != null && !key.isBlank()) {
                            deps.add(key);
                        }
                    }
                }
            }
            depsByKey.put(cat.pluginKey, deps);
        }

        List<PluginCatalog> sorted = new ArrayList<>();
        Set<String> resolved = new HashSet<>();
        List<String> remaining = new ArrayList<>(byKey.keySet());

        boolean progress = true;
        while (!remaining.isEmpty() && progress) {
            progress = false;
            Iterator<String> it = remaining.iterator();
            while (it.hasNext()) {
                String key = it.next();
                Set<String> deps = depsByKey.getOrDefault(key, Set.of());
                boolean allSatisfied = true;
                for (String dep : deps) {
                    if (byKey.containsKey(dep) && !resolved.contains(dep)) {
                        allSatisfied = false;
                        break;
                    }
                }
                if (allSatisfied) {
                    sorted.add(byKey.get(key));
                    resolved.add(key);
                    it.remove();
                    progress = true;
                }
            }
        }
        for (String key : remaining) {
            sorted.add(byKey.get(key));
        }
        return sorted;
    }

    /**
     * Keeps the legacy {@code tenants.allowed_plugins} entitlement list in sync
     * with the {@code tenant_plugins} ledger (same behaviour as the V4.0.0
     * backfill for existing tenants).
     */
    private void ensureAllowedPlugin(UUID tenantId, String pluginKey) {
        entityManager.createNativeQuery("""
                UPDATE tenants SET allowed_plugins = CASE
                    WHEN COALESCE(allowed_plugins, '[]'::jsonb) @> jsonb_build_array(?2) THEN allowed_plugins
                    ELSE COALESCE(allowed_plugins, '[]'::jsonb) || jsonb_build_array(?2)
                END
                WHERE id = ?1
                """)
            .setParameter(1, tenantId)
            .setParameter(2, pluginKey)
            .executeUpdate();
    }
}
