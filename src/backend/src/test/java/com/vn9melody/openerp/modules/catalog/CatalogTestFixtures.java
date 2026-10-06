package com.vn9melody.openerp.modules.catalog;

import com.vn9melody.openerp.core.enums.CatalogHierarchyMode;
import com.vn9melody.openerp.core.enums.CatalogRelationType;
import com.vn9melody.openerp.modules.catalog.model.CatalogItem;
import com.vn9melody.openerp.modules.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.modules.catalog.model.CatalogType;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.UUID;

/**
 * Catalog fixtures for the Sprint 05 repository/seeder tests. Every row created
 * here is either tenant-scoped or carries the {@code S2CAT} code prefix so
 * {@link #cleanup(EntityManager)} can remove exactly the test data and leave
 * the migration-seeded system types and admin units untouched.
 *
 * <p>Must be called inside an active transaction.</p>
 */
public final class CatalogTestFixtures {

    public static final String PREFIX = "S2CAT";

    private CatalogTestFixtures() {
    }

    public static void cleanup(EntityManager entityManager) {
        String testTenants = "(SELECT id FROM tenants WHERE slug LIKE 's2iam-%')";
        String testItems = "(SELECT id FROM catalog_items WHERE code LIKE ?1"
            + " OR tenant_id IN " + testTenants + ")";
        entityManager.createNativeQuery(
                "DELETE FROM catalog_item_edges WHERE parent_item_id IN " + testItems
                    + " OR child_item_id IN " + testItems)
            .setParameter(1, PREFIX + "%")
            .executeUpdate();
        entityManager.createNativeQuery("DELETE FROM catalog_items WHERE code LIKE ?1"
                + " OR tenant_id IN " + testTenants)
            .setParameter(1, PREFIX + "%")
            .executeUpdate();
        entityManager.createNativeQuery("DELETE FROM catalog_type_grants WHERE tenant_id IN " + testTenants)
            .executeUpdate();
        entityManager.createNativeQuery("DELETE FROM catalog_types WHERE code LIKE ?1"
                + " OR tenant_id IN " + testTenants)
            .setParameter(1, PREFIX + "%")
            .executeUpdate();
    }

    public static CatalogType createType(UUID tenantId, String code, CatalogHierarchyMode mode) {
        CatalogType type = new CatalogType();
        type.tenantId = tenantId;
        type.code = code;
        type.nameKey = "CATALOG_TYPE_" + code;
        type.hierarchyMode = mode;
        type.persist();
        return type;
    }

    public static CatalogType createSystemType(String code, CatalogHierarchyMode mode) {
        return createType(null, code, mode);
    }

    public static CatalogItem createItem(UUID tenantId, UUID typeId, String code, String name,
                                         Instant validFrom, Instant validTo) {
        return createItemVersion(tenantId, typeId, UUID.randomUUID(), 1, code, name, validFrom, validTo);
    }

    public static CatalogItem createItemVersion(UUID tenantId, UUID typeId, UUID versionGroupId, int version,
                                                String code, String name, Instant validFrom, Instant validTo) {
        CatalogItem item = new CatalogItem();
        item.tenantId = tenantId;
        item.typeId = typeId;
        item.versionGroupId = versionGroupId;
        item.version = version;
        item.code = code;
        item.name = name;
        item.validFrom = validFrom;
        item.validTo = validTo;
        item.persist();
        return item;
    }

    public static CatalogItemEdge createEdge(UUID tenantId, UUID parentItemId, UUID childItemId,
                                             CatalogRelationType relationType) {
        CatalogItemEdge edge = new CatalogItemEdge();
        edge.tenantId = tenantId;
        edge.parentItemId = parentItemId;
        edge.childItemId = childItemId;
        edge.relationType = relationType;
        edge.persist();
        return edge;
    }
}
