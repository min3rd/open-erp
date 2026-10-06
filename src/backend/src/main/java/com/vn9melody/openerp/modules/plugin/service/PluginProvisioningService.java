package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Tenant provisioning hook for system-default plugins (TASK-307 / Gate Q5):
 * new tenants automatically receive every catalog entry marked
 * {@code default_install}. Locked defaults are activated immediately; optional
 * defaults are only entitled (NOT_INSTALLED) for the tenant admin to enable.
 *
 * <p>Locked defaults without a published version are in-process core plugins
 * (SOL-S05-001 D1: the {@code catalog} plugin) and are activated directly on
 * the ledger instead of going through the container deploy saga.</p>
 */
@ApplicationScoped
public class PluginProvisioningService {

    private static final Logger LOG = Logger.getLogger(PluginProvisioningService.class);

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginVersionRepository versionRepository;

    @Inject
    PluginEntitlementService entitlementService;

    @Inject
    PluginLifecycleService lifecycleService;

    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "openerp.core.version", defaultValue = "1.0.0")
    String coreVersion;

    @Transactional
    public int provisionDefaults(UUID tenantId) {
        if (tenantId == null) {
            return 0;
        }
        int provisioned = 0;
        for (PluginCatalog catalog : catalogRepository.listDefaultInstall()) {
            if (catalog.catalogStatus != PluginCatalogStatus.ACTIVE) {
                continue;
            }
            try {
                if (!entitlementService.grantIfExists(tenantId, catalog.pluginKey)) {
                    continue;
                }
                ensureAllowedPlugin(tenantId, catalog.pluginKey);
                if (catalog.locked) {
                    if (versionRepository.listInstallable(catalog.id).isEmpty()) {
                        activateInProcess(tenantId, catalog);
                    } else {
                        lifecycleService.install(tenantId, catalog.pluginKey, null, null);
                    }
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

    private void activateInProcess(UUID tenantId, PluginCatalog catalog) {
        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, catalog.pluginKey).orElse(null);
        if (ledger == null || ledger.status == TenantPluginStatus.ACTIVE) {
            return;
        }
        Instant now = Instant.now();
        ledger.status = TenantPluginStatus.ACTIVE;
        ledger.installedVersion = coreVersion;
        ledger.installedAt = now;
        ledger.activatedAt = now;
        ledger.updatedAt = now;
    }
}
