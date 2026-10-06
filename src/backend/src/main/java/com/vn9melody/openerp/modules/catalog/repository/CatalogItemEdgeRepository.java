package com.vn9melody.openerp.modules.catalog.repository;

import com.vn9melody.openerp.core.enums.CatalogRelationType;
import com.vn9melody.openerp.core.enums.CatalogStatus;
import com.vn9melody.openerp.modules.catalog.model.CatalogItem;
import com.vn9melody.openerp.modules.catalog.model.CatalogItemEdge;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class CatalogItemEdgeRepository implements PanacheRepositoryBase<CatalogItemEdge, UUID> {

    /** Sentinel bound instead of a null tenant id in native queries. */
    static final UUID NO_TENANT = new UUID(0L, 0L);

    public List<CatalogItemEdge> listActiveByParent(UUID parentItemId) {
        return list("parentItemId = ?1 and validTo is null and status = ?2 order by sortOrder asc",
                parentItemId, CatalogStatus.ACTIVE);
    }

    /** Active parent edges of one child (direct parents, as-of). */
    public List<CatalogItemEdge> listActiveByChild(UUID childItemId, UUID tenantId, Instant asOf) {
        return listActiveByChildIds(List.of(childItemId), tenantId, asOf);
    }

    /** Active child edges of one parent (direct children, as-of). */
    public List<CatalogItemEdge> listActiveByParentId(UUID parentItemId, UUID tenantId, Instant asOf) {
        String sql = """
                SELECT e.* FROM catalog_item_edges e
                WHERE e.parent_item_id = :parentItemId
                  AND tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                  AND e.status = 'ACTIVE'
                  AND (e.tenant_id = :tenantId OR e.tenant_id IS NULL)
                ORDER BY e.sort_order asc, e.created_at asc
                """;
        return getEntityManager().createNativeQuery(sql, CatalogItemEdge.class)
                .setParameter("parentItemId", parentItemId)
                .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
                .setParameter("asOf", asOf)
                .getResultList();
    }

    /** Active parent edges of a batch of children (no N+1 when enriching options pages). */
    public List<CatalogItemEdge> listActiveByChildIds(Collection<UUID> childIds, UUID tenantId, Instant asOf) {
        if (childIds == null || childIds.isEmpty()) {
            return List.of();
        }
        String sql = """
                SELECT e.* FROM catalog_item_edges e
                WHERE e.child_item_id IN (:childIds)
                  AND tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                  AND e.status = 'ACTIVE'
                  AND (e.tenant_id = :tenantId OR e.tenant_id IS NULL)
                ORDER BY e.sort_order asc, e.created_at asc
                """;
        return getEntityManager().createNativeQuery(sql, CatalogItemEdge.class)
                .setParameter("childIds", childIds)
                .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
                .setParameter("asOf", asOf)
                .getResultList();
    }

    /** Ids of the given items that have at least one active child edge (has_children flag). */
    public List<UUID> findParentIdsWithActiveChildren(Collection<UUID> parentIds, UUID tenantId, Instant asOf) {
        if (parentIds == null || parentIds.isEmpty()) {
            return List.of();
        }
        String sql = """
                SELECT DISTINCT e.parent_item_id FROM catalog_item_edges e
                WHERE e.parent_item_id IN (:parentIds)
                  AND tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                  AND e.status = 'ACTIVE'
                  AND (e.tenant_id = :tenantId OR e.tenant_id IS NULL)
                """;
        return getEntityManager().createNativeQuery(sql, UUID.class)
                .setParameter("parentIds", parentIds)
                .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
                .setParameter("asOf", asOf)
                .getResultList();
    }

    /** Currently effective edge of the exact (owner, parent, child, relation) tuple. */
    public CatalogItemEdge findActiveEdge(UUID tenantId, UUID parentItemId, UUID childItemId,
                                          CatalogRelationType relationType) {
        if (tenantId == null) {
            return find("tenantId is null and parentItemId = ?1 and childItemId = ?2 and relationType = ?3 "
                    + "and validTo is null", parentItemId, childItemId, relationType).firstResult();
        }
        return find("tenantId = ?1 and parentItemId = ?2 and childItemId = ?3 and relationType = ?4 "
                + "and validTo is null", tenantId, parentItemId, childItemId, relationType).firstResult();
    }

    /** Edge owned by the tenant (platform scope = system edges only). */
    public CatalogItemEdge findVisibleEdge(UUID tenantId, UUID edgeId) {
        if (edgeId == null) {
            return null;
        }
        if (tenantId == null) {
            return find("id = ?1 and tenantId is null", edgeId).firstResult();
        }
        return find("id = ?1 and tenantId = ?2", edgeId, tenantId).firstResult();
    }

    /** Number of currently effective parent edges of a child (min_parents guard). */
    public long countActiveParents(UUID childItemId) {
        return count("childItemId = ?1 and validTo is null and status = ?2", childItemId, CatalogStatus.ACTIVE);
    }

    /**
     * Descendants of {@code rootId} at {@code asOf}, bounded by maxDepth
     * (DES-DB-S05-001 T4.1). The tenant filter keeps other tenants' rows out of
     * the result while still allowing system rows.
     */
    public List<CatalogItem> findDescendants(UUID rootId, UUID tenantId, Instant asOf, int maxDepth) {
        String sql = """
                WITH RECURSIVE subtree AS (
                    SELECT e.child_item_id AS id, 1 AS depth
                    FROM catalog_item_edges e
                    WHERE e.parent_item_id = :rootId
                      AND tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                      AND e.status = 'ACTIVE'
                    UNION ALL
                    SELECT e.child_item_id, s.depth + 1
                    FROM catalog_item_edges e
                    JOIN subtree s ON e.parent_item_id = s.id
                    WHERE tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                      AND e.status = 'ACTIVE'
                      AND s.depth < :maxDepth
                )
                SELECT DISTINCT i.*
                FROM catalog_items i
                JOIN subtree s ON s.id = i.id
                WHERE i.tenant_id = :tenantId OR i.tenant_id IS NULL
                ORDER BY i.code asc
                """;
        return getEntityManager().createNativeQuery(sql, CatalogItem.class)
                .setParameter("rootId", rootId)
                .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
                .setParameter("asOf", asOf)
                .setParameter("maxDepth", maxDepth)
                .getResultList();
    }

    /** Ancestors of {@code itemId} at {@code asOf}, bounded by maxDepth (breadcrumb/path). */
    public List<CatalogItem> findAncestors(UUID itemId, UUID tenantId, Instant asOf, int maxDepth) {
        String sql = """
                WITH RECURSIVE ancestors AS (
                    SELECT e.parent_item_id AS id, 1 AS depth
                    FROM catalog_item_edges e
                    WHERE e.child_item_id = :itemId
                      AND tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                      AND e.status = 'ACTIVE'
                    UNION ALL
                    SELECT e.parent_item_id, a.depth + 1
                    FROM catalog_item_edges e
                    JOIN ancestors a ON e.child_item_id = a.id
                    WHERE tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                      AND e.status = 'ACTIVE'
                      AND a.depth < :maxDepth
                )
                SELECT DISTINCT i.*
                FROM catalog_items i
                JOIN ancestors a ON a.id = i.id
                WHERE i.tenant_id = :tenantId OR i.tenant_id IS NULL
                ORDER BY i.code asc
                """;
        return getEntityManager().createNativeQuery(sql, CatalogItem.class)
                .setParameter("itemId", itemId)
                .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
                .setParameter("asOf", asOf)
                .setParameter("maxDepth", maxDepth)
                .getResultList();
    }

    /**
     * Cycle guard before inserting parent -> child (DES-DB-S05-001 T4.2):
     * true when {@code childId} is already an ancestor of {@code parentId}
     * (including parent == child). The depth bound stops a corrupt pre-existing
     * cycle from recursing forever.
     */
    public boolean wouldCreateCycle(UUID parentId, UUID childId) {
        String sql = """
                WITH RECURSIVE ancestors AS (
                    SELECT CAST(:parentId AS uuid) AS id, 0 AS depth
                    UNION ALL
                    SELECT e.parent_item_id, a.depth + 1
                    FROM catalog_item_edges e
                    JOIN ancestors a ON e.child_item_id = a.id
                    WHERE e.valid_to IS NULL
                      AND e.status = 'ACTIVE'
                      AND a.depth < 1000
                )
                SELECT EXISTS (SELECT 1 FROM ancestors WHERE id = CAST(:childId AS uuid))
                """;
        Object result = getEntityManager().createNativeQuery(sql)
                .setParameter("parentId", parentId)
                .setParameter("childId", childId)
                .getSingleResult();
        return Boolean.TRUE.equals(result);
    }
}
