package com.vn9melody.openerp.modules.iam.repository;

import com.vn9melody.openerp.modules.iam.model.RoleDataPolicy;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class RoleDataPolicyRepository implements PanacheRepository<RoleDataPolicy> {

    public List<RoleDataPolicy> findByTenant(UUID tenantId) {
        return list("tenantId", tenantId);
    }

    public List<RoleDataPolicy> findByRole(UUID roleId) {
        return list("roleId", roleId);
    }

    public RoleDataPolicy findByRoleAndResource(UUID roleId, String resource) {
        return find("roleId = ?1 and resource = ?2", roleId, resource).firstResult();
    }

    public List<RoleDataPolicy> listByRoleAndResource(UUID roleId, String resource) {
        return list("roleId = ?1 and resource = ?2", roleId, resource);
    }
}
