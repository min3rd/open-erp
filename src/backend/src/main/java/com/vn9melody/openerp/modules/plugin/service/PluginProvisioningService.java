package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Tenant provisioning hook for system-default plugins (TASK-307 / Gate Q5):
 * new tenants automatically receive every catalog entry marked
 * {@code default_install}. Locked defaults are activated immediately; optional
 * defaults are only entitled (NOT_INSTALLED) for the tenant admin to enable.
 */
@ApplicationScoped
public class PluginProvisioningService {

    private static final Logger LOG = Logger.getLogger(PluginProvisioningService.class);

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginEntitlementService entitlementService;

    @Inject
    PluginLifecycleService lifecycleService;

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
}
