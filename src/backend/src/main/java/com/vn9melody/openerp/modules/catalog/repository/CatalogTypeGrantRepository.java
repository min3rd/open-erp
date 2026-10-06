package com.vn9melody.openerp.modules.catalog.repository;

import com.vn9melody.openerp.modules.catalog.model.CatalogTypeGrant;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class CatalogTypeGrantRepository implements PanacheRepositoryBase<CatalogTypeGrant, UUID> {

    public List<CatalogTypeGrant> listByTenantAndType(UUID tenantId, UUID typeId) {
        return list("tenantId = ?1 and typeId = ?2 order by roleId asc", tenantId, typeId);
    }

    public Optional<CatalogTypeGrant> findByTenantTypeRole(UUID tenantId, UUID typeId, UUID roleId) {
        return find("tenantId = ?1 and typeId = ?2 and roleId = ?3", tenantId, typeId, roleId)
                .firstResultOptional();
    }

    public List<CatalogTypeGrant> listByTenant(UUID tenantId) {
        return list("tenantId = ?1 order by typeId asc, roleId asc", tenantId);
    }
}
