package com.vn9melody.openerp.modules.catalog.repository;

import com.vn9melody.openerp.modules.catalog.model.CatalogItem;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class CatalogItemRepository implements PanacheRepositoryBase<CatalogItem, UUID> {

    /** Sentinel bound instead of a null tenant id in native queries. */
    static final UUID NO_TENANT = new UUID(0L, 0L);

    /** Shared FROM/WHERE of the merged options query (DES-DB-S05-001 T4.3). */
    private static final String OPTIONS_FILTER = """
            FROM catalog_items i
            JOIN catalog_types t ON t.id = i.type_id
            WHERE t.code = :typeCode
              AND (i.tenant_id = :tenantId OR i.tenant_id IS NULL)
              AND tstzrange(i.valid_from, i.valid_to) @> CAST(:asOf AS timestamptz)
              AND (:q = '' OR i.code ILIKE '%' || :q || '%' OR i.name ILIKE '%' || :q || '%')
            """;

    /** Parent filter applied to the merged rows (both list and count). */
    private static final String OPTIONS_PARENT_FILTER = """
              AND (:parentIdText = '' OR merged.id IN (
                  SELECT e.child_item_id FROM catalog_item_edges e
                  WHERE e.parent_item_id = CAST(:parentIdText AS uuid)
                    AND tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                    AND e.status = 'ACTIVE'
                    AND (e.tenant_id = :tenantId OR e.tenant_id IS NULL)))
            """;

    /** Current row for (tenant or system, type, code) — no validity filter. */
    public CatalogItem findCurrentByCode(UUID tenantId, UUID typeId, String code) {
        if (tenantId == null) {
            return find("tenantId is null and typeId = ?1 and code = ?2 and validTo is null", typeId, code)
                    .firstResult();
        }
        return find("tenantId = ?1 and typeId = ?2 and code = ?3 and validTo is null", tenantId, typeId, code)
                .firstResult();
    }

    /** First visible (tenant or system) current row matching code OR name, for inline duplicate checks. */
    public CatalogItem findVisibleCurrentByTypeCode(String typeCode, UUID tenantId, String code, String name) {
        String sql = """
                SELECT i.* FROM catalog_items i
                JOIN catalog_types t ON t.id = i.type_id
                WHERE t.code = :typeCode AND i.valid_to IS NULL
                  AND (i.tenant_id = :tenantId OR i.tenant_id IS NULL)
                  AND (lower(i.code) = lower(:code) OR lower(i.name) = lower(:name))
                LIMIT 1
                """;
        return (CatalogItem) getEntityManager().createNativeQuery(sql, CatalogItem.class)
                .setParameter("typeCode", typeCode)
                .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
                .setParameter("code", code)
                .setParameter("name", name)
                .getResultList().stream()
                .findFirst()
                .orElse(null);
    }

    public List<CatalogItem> listCurrentByType(UUID tenantId, UUID typeId) {
        return list("typeId = ?1 and validTo is null and (tenantId = ?2 or tenantId is null) order by code asc",
                typeId, tenantId);
    }

    /** A row visible to the tenant: its own or a system row (platform scope = system rows only). */
    public CatalogItem findVisibleById(UUID tenantId, UUID itemId) {
        if (itemId == null) {
            return null;
        }
        if (tenantId == null) {
            return find("id = ?1 and tenantId is null", itemId).firstResult();
        }
        return find("id = ?1 and (tenantId = ?2 or tenantId is null)", itemId, tenantId).firstResult();
    }

    public List<CatalogItem> listVisibleByIds(UUID tenantId, Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        if (tenantId == null) {
            return list("id in ?1 and tenantId is null order by code asc", ids);
        }
        return list("id in ?1 and (tenantId = ?2 or tenantId is null) order by code asc", ids, tenantId);
    }

    /** Every version of one version group, newest first. */
    public List<CatalogItem> listVersions(UUID tenantId, UUID versionGroupId) {
        if (tenantId == null) {
            return list("versionGroupId = ?1 and tenantId is null order by version desc", versionGroupId);
        }
        return list("versionGroupId = ?1 and tenantId = ?2 order by version desc", versionGroupId, tenantId);
    }

    /** Codes of the page that also exist as active system rows at {@code asOf} (override badge). */
    public Set<String> findSystemCodes(String typeCode, Instant asOf, Collection<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return Set.of();
        }
        List<String> found = getEntityManager().createNativeQuery("""
                SELECT DISTINCT i.code FROM catalog_items i
                JOIN catalog_types t ON t.id = i.type_id
                WHERE t.code = :typeCode AND i.tenant_id IS NULL AND i.code IN (:codes)
                  AND tstzrange(i.valid_from, i.valid_to) @> CAST(:asOf AS timestamptz)
                  AND i.status = 'ACTIVE'
                """, String.class)
                .setParameter("typeCode", typeCode)
                .setParameter("codes", codes)
                .setParameter("asOf", asOf)
                .getResultList();
        return new HashSet<>(found);
    }

    /**
     * Merged options for a dynamic form (DES-DB-S05-001 T4.3): system rows plus
     * the tenant's own rows, valid at {@code asOf}, tenant row wins per code
     * (DISTINCT ON), optional code/name search, optional parent filter and
     * pagination. A tenant row wins even when INACTIVE, so a tenant override
     * marked INACTIVE hides the system row for that tenant only (TASK-391).
     */
    public List<CatalogItem> findMergedOptions(String typeCode, UUID tenantId, Instant asOf,
                                               String q, UUID parentId, int offset, int limit) {
        String sql = "SELECT merged.* FROM (SELECT DISTINCT ON (i.code) i.* " + OPTIONS_FILTER
                + " ORDER BY i.code asc, (i.tenant_id IS NULL) asc) merged"
                + " WHERE merged.status = 'ACTIVE' " + OPTIONS_PARENT_FILTER
                + " ORDER BY merged.code asc LIMIT :limit OFFSET :offset";
        return getEntityManager().createNativeQuery(sql, CatalogItem.class)
                .setParameter("typeCode", typeCode)
                .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
                .setParameter("asOf", asOf)
                .setParameter("q", q == null ? "" : q.trim())
                .setParameter("parentIdText", parentId != null ? parentId.toString() : "")
                .setParameter("limit", limit)
                .setParameter("offset", offset)
                .getResultList();
    }

    /** Backwards-compatible overload without a parent filter. */
    public List<CatalogItem> findMergedOptions(String typeCode, UUID tenantId, Instant asOf,
                                               String q, int offset, int limit) {
        return findMergedOptions(typeCode, tenantId, asOf, q, null, offset, limit);
    }

    public long countMergedOptions(String typeCode, UUID tenantId, Instant asOf, String q, UUID parentId) {
        String sql = "SELECT count(*) FROM (SELECT DISTINCT ON (i.code) i.id, i.status " + OPTIONS_FILTER
                + " ORDER BY i.code asc, (i.tenant_id IS NULL) asc) merged"
                + " WHERE merged.status = 'ACTIVE' " + OPTIONS_PARENT_FILTER;
        Number count = (Number) getEntityManager().createNativeQuery(sql)
                .setParameter("typeCode", typeCode)
                .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
                .setParameter("asOf", asOf)
                .setParameter("q", q == null ? "" : q.trim())
                .setParameter("parentIdText", parentId != null ? parentId.toString() : "")
                .getSingleResult();
        return count == null ? 0L : count.longValue();
    }

    /** Backwards-compatible overload without a parent filter. */
    public long countMergedOptions(String typeCode, UUID tenantId, Instant asOf, String q) {
        return countMergedOptions(typeCode, tenantId, asOf, q, null);
    }

    /**
     * Shared WHERE of the admin list/count/export queries: tenant + system rows
     * valid at {@code asOf}, optional q/status/parent/relation filters.
     * {@code tenantId == null} targets the system catalogue.
     */
    private static final String ADMIN_FILTER = """
            i.type_id = :typeId
              AND (i.tenant_id = :tenantId OR i.tenant_id IS NULL)
              AND tstzrange(i.valid_from, i.valid_to) @> CAST(:asOf AS timestamptz)
              AND (:q = '' OR i.code ILIKE '%' || :q || '%' OR i.name ILIKE '%' || :q || '%')
              AND (:status = '' OR i.status = :status)
              AND (:parentIdText = '' OR EXISTS (
                  SELECT 1 FROM catalog_item_edges e
                  WHERE e.child_item_id = i.id AND e.parent_item_id = CAST(:parentIdText AS uuid)
                    AND tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                    AND e.status = 'ACTIVE'))
              AND (:relationType = '' OR EXISTS (
                  SELECT 1 FROM catalog_item_edges e
                  WHERE e.child_item_id = i.id AND e.relation_type = :relationType
                    AND tstzrange(e.valid_from, e.valid_to) @> CAST(:asOf AS timestamptz)
                    AND e.status = 'ACTIVE'
                    AND (e.tenant_id = :tenantId OR e.tenant_id IS NULL)))
            """;

    /** Admin item list of one type (DES-API section 3), newest version first per code. */
    public List<CatalogItem> findItemsForAdmin(UUID tenantId, UUID typeId, Instant asOf, String q, String status,
                                               UUID parentId, String relationType, int offset, int limit) {
        String sql = "SELECT i.* FROM catalog_items i WHERE " + ADMIN_FILTER
            + " ORDER BY i.code asc, i.version desc LIMIT :limit OFFSET :offset";
        return bindAdminFilter(getEntityManager().createNativeQuery(sql, CatalogItem.class), tenantId, typeId, asOf,
            q, status, parentId, relationType)
            .setParameter("limit", limit)
            .setParameter("offset", offset)
            .getResultList();
    }

    public long countItemsForAdmin(UUID tenantId, UUID typeId, Instant asOf, String q, String status,
                                   UUID parentId, String relationType) {
        String sql = "SELECT count(*) FROM catalog_items i WHERE " + ADMIN_FILTER;
        Number count = (Number) bindAdminFilter(getEntityManager().createNativeQuery(sql), tenantId, typeId, asOf,
            q, status, parentId, relationType).getSingleResult();
        return count == null ? 0L : count.longValue();
    }

    /** Every admin-filtered row (no pagination) for the CSV export. */
    public List<CatalogItem> findItemsForExport(UUID tenantId, UUID typeId, Instant asOf, String q, String status,
                                                UUID parentId, String relationType) {
        String sql = "SELECT i.* FROM catalog_items i WHERE " + ADMIN_FILTER
            + " ORDER BY i.code asc, i.version desc";
        return bindAdminFilter(getEntityManager().createNativeQuery(sql, CatalogItem.class), tenantId, typeId, asOf,
            q, status, parentId, relationType).getResultList();
    }

    private static jakarta.persistence.Query bindAdminFilter(jakarta.persistence.Query query, UUID tenantId,
                                                              UUID typeId, Instant asOf, String q, String status,
                                                              UUID parentId, String relationType) {
        return query
            .setParameter("tenantId", tenantId != null ? tenantId : NO_TENANT)
            .setParameter("typeId", typeId)
            .setParameter("asOf", asOf)
            .setParameter("q", q == null ? "" : q.trim())
            .setParameter("status", status == null ? "" : status.trim().toUpperCase())
            .setParameter("parentIdText", parentId != null ? parentId.toString() : "")
            .setParameter("relationType", relationType == null ? "" : relationType.trim().toUpperCase());
    }
}
