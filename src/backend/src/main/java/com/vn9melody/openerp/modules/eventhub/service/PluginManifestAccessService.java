package com.vn9melody.openerp.modules.eventhub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Loads the published manifest of an installed plugin version (cached). */
@ApplicationScoped
public class PluginManifestAccessService {

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Inject
    PluginVersionRepository versionRepository;

    private final ConcurrentHashMap<String, Optional<JsonNode>> cache = new ConcurrentHashMap<>();

    public Optional<TenantPlugin> activeLedger(UUID tenantId, String pluginKey) {
        return tenantPluginRepository.findByTenantAndKey(tenantId, pluginKey)
                .filter(ledger -> ledger.status == TenantPluginStatus.ACTIVE);
    }

    public Optional<JsonNode> manifestOf(UUID tenantId, String pluginKey) {
        Optional<TenantPlugin> ledger = activeLedger(tenantId, pluginKey);
        if (ledger.isEmpty()) {
            return Optional.empty();
        }
        String cacheKey = pluginKey + "@" + ledger.get().installedVersion;
        return cache.computeIfAbsent(cacheKey, key -> {
            PluginCatalog catalog = catalogRepository.findById(ledger.get().catalogId);
            if (catalog == null) {
                return Optional.<JsonNode>empty();
            }
            return versionRepository
                    .findByCatalogAndVersion(catalog.id, ledger.get().installedVersion)
                    .map(version -> version.manifest)
                    .filter(manifest -> manifest != null && manifest.isObject());
        });
    }

    /** ADR-S08-003: only plugins that declare public_access:true accept anonymous sessions. */
    public boolean publicAccessEnabled(UUID tenantId, String pluginKey) {
        return manifestOf(tenantId, pluginKey)
                .map(manifest -> manifest.path("public_access").asBoolean(false))
                .orElse(false);
    }

    public void evict(String pluginKey) {
        cache.keySet().removeIf(key -> key.startsWith(pluginKey + "@"));
    }
}
