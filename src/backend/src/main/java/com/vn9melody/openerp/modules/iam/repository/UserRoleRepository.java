package com.vn9melody.openerp.modules.iam.repository;

import com.vn9melody.openerp.modules.iam.model.UserRole;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UserRoleRepository implements PanacheRepository<UserRole> {

    public List<UserRole> listByUser(UUID userId, UUID tenantId) {
        return list("userId = ?1 and tenantId = ?2", userId, tenantId);
    }

    public List<UserRole> findByTenant(UUID tenantId) {
        return list("tenantId", tenantId);
    }

    public UserRole findAssignment(UUID userId, UUID tenantId, UUID roleId) {
        return find("userId = ?1 and tenantId = ?2 and roleId = ?3", userId, tenantId, roleId).firstResult();
    }

    public long countByRole(UUID tenantId, UUID roleId) {
        return count("tenantId = ?1 and roleId = ?2", tenantId, roleId);
    }

    public List<UUID> listUserIdsByRole(UUID tenantId, UUID roleId) {
        return getEntityManager()
            .createQuery("select ur.userId from UserRole ur where ur.tenantId = ?1 and ur.roleId = ?2", UUID.class)
            .setParameter(1, tenantId)
            .setParameter(2, roleId)
            .getResultList();
    }
}
