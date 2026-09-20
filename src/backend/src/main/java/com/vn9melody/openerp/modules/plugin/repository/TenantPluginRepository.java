package com.vn9melody.openerp.modules.plugin.repository;

import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TenantPluginRepository implements PanacheRepository<TenantPlugin> {

    public Optional<TenantPlugin> findByTenantAndKey(UUID tenantId, String pluginKey) {
        return find("tenantId = ?1 and pluginKey = ?2", tenantId, pluginKey).firstResultOptional();
    }

    public List<TenantPlugin> listByTenant(UUID tenantId) {
        return list("tenantId = ?1 order by pluginKey asc", tenantId);
    }

    public List<TenantPlugin> listActiveByTenant(UUID tenantId) {
        return list("tenantId = ?1 and status = ?2 order by pluginKey asc", tenantId, TenantPluginStatus.ACTIVE);
    }

    public List<TenantPlugin> listByPlugin(String pluginKey) {
        return list("pluginKey = ?1 order by tenantId asc", pluginKey);
    }

    public List<TenantPlugin> listByPluginAndStatuses(String pluginKey, List<TenantPluginStatus> statuses) {
        return list("pluginKey = ?1 and status in ?2 order by tenantId asc", pluginKey, statuses);
    }

    public long countByPluginAndStatus(String pluginKey, TenantPluginStatus status) {
        return count("pluginKey = ?1 and status = ?2", pluginKey, status);
    }
}
