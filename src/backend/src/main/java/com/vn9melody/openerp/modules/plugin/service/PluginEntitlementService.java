package com.vn9melody.openerp.modules.plugin.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.UUID;

/**
 * Entitlement grant/revoke on the single tenant_plugins ledger (DES-03-API
 * P12/P13, TASK-306). Presence of a row means the tenant may install the plugin.
 */
@ApplicationScoped
public class PluginEntitlementService {

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Transactional
    public TenantPlugin grant(UUID tenantId, String pluginKey) {
        PluginCatalog catalog = requireCatalog(pluginKey);
        if (catalog.catalogStatus == PluginCatalogStatus.BLOCKED) {
            throw new ApiException(403, PluginErrorCode.PLUGIN_BLOCKED_BY_PLATFORM, "Catalog is blocked");
        }
        TenantPlugin existing = tenantPluginRepository.findByTenantAndKey(tenantId, catalog.pluginKey).orElse(null);
        if (existing != null) {
            return existing;
        }
        TenantPlugin ledger = new TenantPlugin();
        ledger.tenantId = tenantId;
        ledger.catalogId = catalog.id;
        ledger.pluginKey = catalog.pluginKey;
        ledger.status = TenantPluginStatus.NOT_INSTALLED;
        ledger.createdAt = Instant.now();
        ledger.updatedAt = ledger.createdAt;
        tenantPluginRepository.persist(ledger);
        return ledger;
    }

    @Transactional
    public void revoke(UUID tenantId, String pluginKey) {
        TenantPlugin ledger = tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey)
                .orElseThrow(() -> new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND,
                        "Entitlement not found"));
        if (ledger.status != TenantPluginStatus.NOT_INSTALLED
                && ledger.status != TenantPluginStatus.UNINSTALLED) {
            throw new ApiException(409, PluginErrorCode.PLUGIN_IN_USE_BY_TENANTS,
                    "Uninstall the plugin before revoking the entitlement");
        }
        tenantPluginRepository.delete(ledger);
    }

    private PluginCatalog requireCatalog(String pluginKey) {
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Plugin not found");
        }
        return catalog;
    }
}
