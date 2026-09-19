package com.vn9melody.openerp.modules.iam.repository;

import com.vn9melody.openerp.modules.iam.model.RolePermission;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class RolePermissionRepository implements PanacheRepository<RolePermission> {

    public List<RolePermission> listByRole(UUID roleId) {
        return list("roleId", roleId);
    }

    public boolean existsByRoleAndPermission(UUID roleId, UUID permissionId) {
        return count("roleId = ?1 and permissionId = ?2", roleId, permissionId) > 0;
    }

    public long deleteByRole(UUID roleId) {
        return delete("roleId", roleId);
    }

    public long countByRole(UUID roleId) {
        return count("roleId", roleId);
    }
}
