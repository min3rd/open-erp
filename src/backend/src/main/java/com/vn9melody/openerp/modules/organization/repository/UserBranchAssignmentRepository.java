package com.vn9melody.openerp.modules.organization.repository;

import com.vn9melody.openerp.modules.organization.model.UserBranchAssignment;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UserBranchAssignmentRepository implements PanacheRepository<UserBranchAssignment> {

    public List<UserBranchAssignment> findByTenant(UUID tenantId) {
        return list("tenantId", tenantId);
    }

    public List<UserBranchAssignment> listByUser(UUID userId, UUID tenantId) {
        return list("userId = ?1 and tenantId = ?2 order by isPrimary desc", userId, tenantId);
    }

    public UserBranchAssignment findPrimary(UUID userId, UUID tenantId) {
        return find("userId = ?1 and tenantId = ?2 and isPrimary = true", userId, tenantId).firstResult();
    }

    public List<UserBranchAssignment> listManagedByUser(UUID userId, UUID tenantId) {
        return list("userId = ?1 and tenantId = ?2 and canManage = true", userId, tenantId);
    }

    public List<UserBranchAssignment> listByBranch(UUID tenantId, UUID branchId) {
        return list("tenantId = ?1 and branchId = ?2", tenantId, branchId);
    }
}
