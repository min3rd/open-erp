package com.vn9melody.openerp.modules.organization.repository;

import com.vn9melody.openerp.modules.organization.model.Branch;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class BranchRepository implements PanacheRepository<Branch> {

    public List<Branch> findByTenant(UUID tenantId) {
        return list("tenantId = ?1 order by code asc", tenantId);
    }

    public Branch findByTenantAndCode(UUID tenantId, String code) {
        return find("tenantId = ?1 and code = ?2", tenantId, code).firstResult();
    }

    public Branch findDefaultByTenant(UUID tenantId) {
        return find("tenantId = ?1 and isDefault = true", tenantId).firstResult();
    }

    public long countByTenant(UUID tenantId) {
        return count("tenantId", tenantId);
    }
}
