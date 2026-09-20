package com.vn9melody.openerp.modules.plugin.repository;

import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PluginCatalogRepository implements PanacheRepositoryBase<PluginCatalog, UUID> {

    public PluginCatalog findByPluginKey(String pluginKey) {
        return find("pluginKey", pluginKey).firstResult();
    }

    public boolean existsByPluginKey(String pluginKey) {
        return count("pluginKey", pluginKey) > 0;
    }

    public List<PluginCatalog> listPlatform() {
        return list("visibility = ?1 order by pluginKey asc", PluginVisibility.PLATFORM);
    }

    public List<PluginCatalog> listTenantPrivate(UUID tenantId) {
        return list("visibility = ?1 and ownerTenantId = ?2 order by pluginKey asc",
                PluginVisibility.TENANT_PRIVATE, tenantId);
    }

    public List<PluginCatalog> listTenantPrivateAll() {
        return list("visibility = ?1 order by ownerTenantId asc, pluginKey asc", PluginVisibility.TENANT_PRIVATE);
    }

    public List<PluginCatalog> listDefaultInstall() {
        return list("visibility = ?1 and defaultInstall = true order by pluginKey asc", PluginVisibility.PLATFORM);
    }
}
