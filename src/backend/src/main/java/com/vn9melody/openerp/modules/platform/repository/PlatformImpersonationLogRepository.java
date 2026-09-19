package com.vn9melody.openerp.modules.platform.repository;

import com.vn9melody.openerp.core.enums.ImpersonationStatus;
import com.vn9melody.openerp.modules.platform.model.PlatformImpersonationLog;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PlatformImpersonationLogRepository implements PanacheRepository<PlatformImpersonationLog> {

    public List<PlatformImpersonationLog> listBySuperAdmin(UUID superAdminUserId) {
        return list("superAdminUserId = ?1 order by startedAt desc", superAdminUserId);
    }

    public List<PlatformImpersonationLog> listByTenant(UUID targetTenantId) {
        return list("targetTenantId = ?1 order by startedAt desc", targetTenantId);
    }

    public PlatformImpersonationLog findActiveBySuperAdmin(UUID superAdminUserId) {
        return find("superAdminUserId = ?1 and status = ?2 order by startedAt desc",
            superAdminUserId, ImpersonationStatus.STARTED).firstResult();
    }

    public long countByStatus(ImpersonationStatus status) {
        return count("status", status);
    }
}
