package com.vn9melody.openerp.modules.organization.repository;

import com.vn9melody.openerp.modules.organization.model.UserDepartmentMembership;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UserDepartmentMembershipRepository implements PanacheRepository<UserDepartmentMembership> {

    public List<UserDepartmentMembership> findByTenant(UUID tenantId) {
        return list("tenantId", tenantId);
    }

    public List<UserDepartmentMembership> listByUser(UUID userId, UUID tenantId) {
        return list("userId = ?1 and tenantId = ?2 order by isPrimary desc", userId, tenantId);
    }

    public UserDepartmentMembership findPrimary(UUID userId, UUID tenantId) {
        return find("userId = ?1 and tenantId = ?2 and isPrimary = true", userId, tenantId).firstResult();
    }

    public List<UserDepartmentMembership> listByDepartment(UUID tenantId, UUID departmentId) {
        return list("tenantId = ?1 and departmentId = ?2", tenantId, departmentId);
    }

    public List<UserDepartmentMembership> listByManager(UUID managerUserId) {
        return list("directManagerUserId", managerUserId);
    }

    public long countByTenant(UUID tenantId) {
        return count("tenantId", tenantId);
    }
}
