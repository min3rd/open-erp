package com.vn9melody.openerp.plugins.catalog.repository;

import com.vn9melody.openerp.plugins.catalog.model.CatalogTypeGrant;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class CatalogTypeGrantRepository implements PanacheRepositoryBase<CatalogTypeGrant, UUID> {

    public List<CatalogTypeGrant> listByTenantAndType(UUID tenantId, UUID typeId) {
        return list("tenantId = ?1 and typeId = ?2 order by roleCode asc", tenantId, typeId);
    }

    public Optional<CatalogTypeGrant> findByTenantTypeRole(UUID tenantId, UUID typeId, String roleCode) {
        return find("tenantId = ?1 and typeId = ?2 and roleCode = ?3", tenantId, typeId, roleCode)
                .firstResultOptional();
    }

    public List<CatalogTypeGrant> listByTenant(UUID tenantId) {
        return list("tenantId = ?1 order by typeId asc, roleCode asc", tenantId);
    }
}
