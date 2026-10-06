package com.vn9melody.openerp.modules.catalog.repository;

import com.vn9melody.openerp.modules.catalog.model.CatalogType;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class CatalogTypeRepository implements PanacheRepositoryBase<CatalogType, UUID> {

    public CatalogType findSystemByCode(String code) {
        return find("tenantId is null and code = ?1", code).firstResult();
    }

    public CatalogType findByTenantAndCode(UUID tenantId, String code) {
        return find("tenantId = ?1 and code = ?2", tenantId, code).firstResult();
    }

    /**
     * Effective type for a tenant: the tenant override wins over the system
     * type with the same code (D10/D18).
     */
    public CatalogType findVisibleByCode(UUID tenantId, String code) {
        CatalogType tenantType = tenantId == null ? null : findByTenantAndCode(tenantId, code);
        return tenantType != null ? tenantType : findSystemByCode(code);
    }

    public List<CatalogType> listVisible(UUID tenantId) {
        return list("tenantId = ?1 or tenantId is null order by code asc", tenantId);
    }
}
