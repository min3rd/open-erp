package com.vn9melody.openerp.modules.platform.repository;

import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PlatformSuperAdminRepository implements PanacheRepository<PlatformSuperAdmin> {

    public PlatformSuperAdmin findByUserId(UUID userId) {
        return find("userId", userId).firstResult();
    }

    public List<PlatformSuperAdmin> listActive() {
        return list("isActive = true order by createdAt asc");
    }

    public List<PlatformSuperAdmin> listByRole(PlatformAdminRole role) {
        return list("role = ?1 order by createdAt asc", role);
    }

    public long countActiveByRole(PlatformAdminRole role) {
        return count("role = ?1 and isActive = true", role);
    }
}
