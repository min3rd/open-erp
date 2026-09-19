package com.vn9melody.openerp.modules.platform.repository;

import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.modules.platform.model.PlatformAuditLog;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PlatformAuditLogRepository implements PanacheRepository<PlatformAuditLog> {

    public List<PlatformAuditLog> listByScope(AuditScope scope, int page, int size) {
        return find("scope = ?1 order by createdAt desc", scope)
            .page(page, size)
            .list();
    }

    public List<PlatformAuditLog> listByTenant(UUID tenantId, int page, int size) {
        return find("tenantId = ?1 order by createdAt desc", tenantId)
            .page(page, size)
            .list();
    }

    public List<PlatformAuditLog> listByActor(UUID actorUserId, int page, int size) {
        return find("actorUserId = ?1 order by createdAt desc", actorUserId)
            .page(page, size)
            .list();
    }

    public long countByScope(AuditScope scope) {
        return count("scope", scope);
    }
}
