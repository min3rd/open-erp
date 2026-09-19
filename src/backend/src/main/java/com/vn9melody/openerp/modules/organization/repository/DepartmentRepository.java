package com.vn9melody.openerp.modules.organization.repository;

import com.vn9melody.openerp.modules.organization.model.Department;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class DepartmentRepository implements PanacheRepository<Department> {

    public List<Department> findByTenant(UUID tenantId) {
        return list("tenantId = ?1 order by code asc", tenantId);
    }

    public List<Department> findByBranch(UUID tenantId, UUID branchId) {
        return list("tenantId = ?1 and branchId = ?2 order by code asc", tenantId, branchId);
    }

    public List<Department> findByParent(UUID tenantId, UUID parentId) {
        return list("tenantId = ?1 and parentId = ?2 order by code asc", tenantId, parentId);
    }

    public Department findByTenantAndCode(UUID tenantId, String code) {
        return find("tenantId = ?1 and code = ?2", tenantId, code).firstResult();
    }
}
