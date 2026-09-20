package com.vn9melody.openerp.modules.plugin.repository;

import com.vn9melody.openerp.modules.plugin.model.TenantNotification;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class TenantNotificationRepository implements PanacheRepository<TenantNotification> {

    public List<TenantNotification> listByTenant(UUID tenantId) {
        return list("tenantId = ?1 order by createdAt desc", tenantId);
    }

    public List<TenantNotification> listUnread(UUID tenantId) {
        return list("tenantId = ?1 and readAt is null order by createdAt desc", tenantId);
    }

    public long markAllRead(UUID tenantId) {
        return update("readAt = CURRENT_TIMESTAMP where tenantId = ?1 and readAt is null", tenantId);
    }
}
