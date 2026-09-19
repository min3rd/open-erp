package com.vn9melody.openerp.modules.iam.repository;

import com.vn9melody.openerp.modules.iam.model.Role;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class RoleRepository implements PanacheRepository<Role> {

    public Role findByTenantAndCode(UUID tenantId, String code) {
        return find("tenantId = ?1 and code = ?2", tenantId, code).firstResult();
    }

    public Role findSystemByCode(String code) {
        return find("tenantId is null and code = ?1", code).firstResult();
    }

    public List<Role> listSystemRoles() {
        return list("tenantId is null order by code asc");
    }

    public List<Role> listForTenant(UUID tenantId) {
        return list("(tenantId = ?1 or tenantId is null) order by isSystem desc, code asc", tenantId);
    }

    public long countUsersByRole(UUID tenantId, UUID roleId) {
        return getEntityManager()
            .createQuery("select count(ur) from UserRole ur where ur.tenantId = ?1 and ur.roleId = ?2", Long.class)
            .setParameter(1, tenantId)
            .setParameter(2, roleId)
            .getSingleResult();
    }
}
