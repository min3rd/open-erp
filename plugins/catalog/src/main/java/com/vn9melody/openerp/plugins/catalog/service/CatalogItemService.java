package com.vn9melody.openerp.plugins.catalog.service;

import com.vn9melody.openerp.plugins.catalog.api.ApiException;
import com.vn9melody.openerp.plugins.catalog.api.ErrorCode;
import com.vn9melody.openerp.plugins.catalog.service.AuditTrail;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.api.PlatformAction;
import com.vn9melody.openerp.plugins.catalog.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogSupport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemParentResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemUpdateRequest;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogItemEdgeRepository;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogItemRepository;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

/**
 * Catalog record administration with version + validity semantics
 * (TASK-379 / DES-API-S05-001 section 3): editing closes the current version and
 * creates version n+1, deleting closes {@code valid_to} and history is never
 * mutated. System rows ({@code tenant_id IS NULL}) are read-only for tenants;
 * tenants create their own override row with the same code instead (TASK-391).
 */
@ApplicationScoped
public class CatalogItemService {

    @Inject
    CatalogItemRepository itemRepository;

    @Inject
    CatalogItemEdgeRepository edgeRepository;

    @Inject
    CatalogTypeRepository typeRepository;

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    AuditTrail auditTrail;

    @Inject
    EntityManager entityManager;

    public List<ItemResponse> list(UUID tenantId, String typeCode, String q, String parentIdText,
                                   String relationType, String asOfText, String status, int page, int size) {
        CatalogType type = guard.requireTypeAccess(tenantId, typeCode, CatalogPermissionGuard.Access.READ);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        UUID parentId = CatalogSupport.parseUuid(parentIdText, "parent_id");
        int offset = CatalogSupport.page(page) * CatalogSupport.size(size);
        List<CatalogItem> items = itemRepository.findItemsForAdmin(tenantId, type.id, asOf, q, status,
            parentId, relationType, offset, CatalogSupport.size(size));
        Set<String> codes = new LinkedHashSet<>();
        for (CatalogItem item : items) {
            codes.add(item.code);
        }
        Set<String> systemCodes = tenantId == null ? Set.of()
            : itemRepository.findSystemCodes(type.code, asOf, codes);
        // Batch-load the page's parents (one extra query per page) so the admin list
        // can show the "CHA" column without an N+1 per row.
        Map<UUID, List<ItemParentResponse>> parentsByItem = new HashMap<>();
        List<CatalogItemEdge> edges = edgeRepository.listActiveByChildIds(
            items.stream().map(item -> item.id).toList(), tenantId, asOf);
        if (!edges.isEmpty()) {
            Map<UUID, CatalogItem> parentsById = visibleByIds(tenantId, edges, edge -> edge.parentItemId);
            for (CatalogItemEdge edge : edges) {
                CatalogItem parent = parentsById.get(edge.parentItemId);
                if (parent == null) {
                    continue;
                }
                parentsByItem.computeIfAbsent(edge.childItemId, key -> new ArrayList<>())
                    .add(link(edge, parent));
            }
        }
        return items.stream()
            .map(item -> toResponse(item, type.code,
                item.tenantId != null && systemCodes.contains(item.code),
                parentsByItem.getOrDefault(item.id, List.of()), List.of()))
            .toList();
    }

    public long count(UUID tenantId, String typeCode, String q, String parentIdText, String relationType,
                      String asOfText, String status) {
        CatalogType type = guard.requireTypeAccess(tenantId, typeCode, CatalogPermissionGuard.Access.READ);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        UUID parentId = CatalogSupport.parseUuid(parentIdText, "parent_id");
        return itemRepository.countItemsForAdmin(tenantId, type.id, asOf, q, status, parentId, relationType);
    }

    @Transactional
    public ItemResponse create(UUID tenantId, String typeCode, ItemCreateRequest request) {
        CatalogType type = guard.requireVisibleType(tenantId, typeCode);
        // System types stay read-only as types, but a tenant may create its own
        // override/hide row with an existing system code (TASK-391).
        if (tenantId != null && type.tenantId != null) {
            guard.requireTypeAccess(tenantId, type, CatalogPermissionGuard.Access.WRITE);
        }

        String code = CatalogSupport.normalizeCode(request.code());
        if (code == null) {
            throw CatalogSupport.validation("code", ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        if (code.length() > CatalogSupport.MAX_CODE_LENGTH) {
            throw CatalogSupport.validation("code", ErrorCode.VALIDATION_MAX,
                Map.of("max", CatalogSupport.MAX_CODE_LENGTH));
        }
        if (itemRepository.findCurrentByCode(tenantId, type.id, code) != null) {
            throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_ITEM_CODE_EXISTS,
                Map.of(ResponseKey.CODE.getKey(), code));
        }

        CatalogItem item = new CatalogItem();
        item.tenantId = tenantId;
        item.typeId = type.id;
        item.versionGroupId = UUID.randomUUID();
        item.version = 1;
        item.code = code;
        applyCreate(item, request);
        UUID actor = auditTrail.currentActorUserId();
        item.createdBy = actor;
        item.updatedBy = actor;
        item.validFrom = Instant.now();
        item.persist();
        flushWindowGuard();

        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_ITEM_CREATE, "CATALOG_ITEM", item.id,
            Map.of(ResponseKey.CODE.getKey(), item.code));
        return toResponse(item, type.code, isOverridden(tenantId, item, type.code, item.validFrom));
    }

    @Transactional
    public ItemResponse update(UUID tenantId, UUID itemId, ItemUpdateRequest request) {
        CatalogItem item = requireWritableItem(tenantId, itemId);
        CatalogType type = requireType(item.typeId);
        requireItemWriteGrant(tenantId, type);

        Instant now = Instant.now();
        UUID actor = auditTrail.currentActorUserId();
        item.validTo = now;
        item.updatedAt = now;
        item.updatedBy = actor;
        // Close the current window before inserting n+1: Hibernate executes inserts
        // before updates, and the EXCLUDE constraint would reject the overlap.
        entityManager.flush();

        CatalogItem next = new CatalogItem();
        next.tenantId = item.tenantId;
        next.typeId = item.typeId;
        next.versionGroupId = item.versionGroupId;
        next.version = item.version + 1;
        next.code = item.code;
        next.supersedesItemId = item.id;
        next.validFrom = now;
        applyUpdate(next, request, item);
        next.createdBy = actor;
        next.updatedBy = actor;
        next.persist();
        flushWindowGuard();

        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_ITEM_UPDATE, "CATALOG_ITEM", next.id,
            Map.of(ResponseKey.CODE.getKey(), next.code));
        return toResponse(next, type.code, isOverridden(tenantId, next, type.code, now));
    }

    @Transactional
    public void close(UUID tenantId, UUID itemId) {
        CatalogItem item = requireWritableItem(tenantId, itemId);
        CatalogType type = requireType(item.typeId);
        requireItemWriteGrant(tenantId, type);

        item.validTo = Instant.now();
        item.updatedAt = item.validTo;
        item.updatedBy = auditTrail.currentActorUserId();
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_ITEM_CLOSE, "CATALOG_ITEM", item.id,
            Map.of(ResponseKey.CODE.getKey(), item.code));
    }

    public ItemResponse get(UUID tenantId, UUID itemId, String asOfText, boolean withRelations) {
        CatalogItem item = requireReadableItem(tenantId, itemId);
        CatalogType type = requireType(item.typeId);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        boolean overridden = isOverridden(tenantId, item, type.code, asOf);
        if (!withRelations) {
            return toResponse(item, type.code, overridden);
        }
        return toResponse(item, type.code, overridden, parents(tenantId, itemId, asOfText),
            directChildren(tenantId, item, asOf));
    }

    public List<ItemResponse> versions(UUID tenantId, UUID itemId) {
        CatalogItem item = requireReadableItem(tenantId, itemId);
        CatalogType type = requireType(item.typeId);
        boolean overridden = isOverridden(tenantId, item, type.code, Instant.now());
        // System rows carry tenant_id NULL: list their own version group, not the caller's.
        return itemRepository.listVersions(item.tenantId, item.versionGroupId).stream()
            .map(version -> toResponse(version, type.code, overridden))
            .toList();
    }

    public List<ItemParentResponse> parents(UUID tenantId, UUID itemId, String asOfText) {
        CatalogItem item = requireReadableItem(tenantId, itemId);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        List<CatalogItemEdge> edges = edgeRepository.listActiveByChild(itemId, tenantId, asOf);
        return toLinks(edges, tenantId, edge -> edge.parentItemId);
    }

    public List<ItemResponse> descendants(UUID tenantId, UUID itemId, String asOfText, Integer depth) {
        CatalogItem item = requireReadableItem(tenantId, itemId);
        CatalogType type = requireType(item.typeId);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        int maxDepth = resolveMaxDepth(type, depth);
        return edgeRepository.findDescendants(itemId, tenantId, asOf, maxDepth).stream()
            .map(descendant -> toResponse(descendant, type.code))
            .toList();
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private List<ItemParentResponse> directChildren(UUID tenantId, CatalogItem item, Instant asOf) {
        List<CatalogItemEdge> edges = edgeRepository.listActiveByParentId(item.id, tenantId, asOf);
        return toLinks(edges, tenantId, edge -> edge.childItemId);
    }

    private CatalogItem requireReadableItem(UUID tenantId, UUID itemId) {
        CatalogItem item = itemRepository.findVisibleById(tenantId, itemId);
        if (item == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_ITEM_NOT_FOUND,
                ResponseKey.ID.getKey(), itemId);
        }
        CatalogType type = requireType(item.typeId);
        guard.requireTypeAccess(tenantId, type, CatalogPermissionGuard.Access.READ);
        return item;
    }

    private CatalogItem requireWritableItem(UUID tenantId, UUID itemId) {
        CatalogItem item = itemRepository.findVisibleById(tenantId, itemId);
        if (item == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_ITEM_NOT_FOUND,
                ResponseKey.ID.getKey(), itemId);
        }
        if (tenantId != null && item.tenantId == null) {
            throw new ApiException(403, CatalogErrorCode.CATALOG_SYSTEM_ITEM_READONLY,
                "System catalog rows are read-only for tenants",
                Map.of(ResponseKey.CODE.getKey(), item.code));
        }
        if (item.validTo != null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_ITEM_NOT_FOUND,
                ResponseKey.ID.getKey(), itemId);
        }
        return item;
    }

    private void requireItemWriteGrant(UUID tenantId, CatalogType type) {
        if (tenantId != null && type.tenantId != null) {
            guard.requireTypeAccess(tenantId, type, CatalogPermissionGuard.Access.WRITE);
        }
    }

    private CatalogType requireType(UUID typeId) {
        CatalogType type = typeRepository.findById(typeId);
        if (type == null) {
            throw CatalogTypeService.notFound(ResponseKey.ID.getKey(), typeId);
        }
        return type;
    }

    /** True when the tenant row shadows an active system row with the same code. */
    private boolean isOverridden(UUID tenantId, CatalogItem item, String typeCode, Instant asOf) {
        if (tenantId == null || item.tenantId == null) {
            return false;
        }
        return itemRepository.findSystemCodes(typeCode, asOf, Set.of(item.code)).contains(item.code);
    }

    private static List<UUID> edgeChildIds(List<CatalogItemEdge> edges) {
        Set<UUID> ids = new LinkedHashSet<>();
        for (CatalogItemEdge edge : edges) {
            ids.add(edge.parentItemId);
        }
        return new ArrayList<>(ids);
    }

    /** One query for the related items of a batch of edges (no N+1). */
    private Map<UUID, CatalogItem> visibleByIds(UUID tenantId, List<CatalogItemEdge> edges,
            Function<CatalogItemEdge, UUID> relatedId) {
        Map<UUID, CatalogItem> byId = new HashMap<>();
        for (CatalogItem item : itemRepository.listVisibleByIds(tenantId,
                edges.stream().map(relatedId).distinct().toList())) {
            byId.put(item.id, item);
        }
        return byId;
    }

    private static ItemParentResponse link(CatalogItemEdge edge, CatalogItem related) {
        return new ItemParentResponse(edge.id, related.id, related.code, related.name,
            edge.relationType.name(), edge.sortOrder, edge.validFrom, edge.validTo,
            related.tenantId == null);
    }

    /**
     * Maps edges to parent/child links; the first edge wins when the same related
     * item appears twice (no unique constraint on the edge table).
     */
    private List<ItemParentResponse> toLinks(List<CatalogItemEdge> edges, UUID tenantId,
            Function<CatalogItemEdge, UUID> relatedId) {
        if (edges.isEmpty()) {
            return List.of();
        }
        Map<UUID, CatalogItem> relatedById = visibleByIds(tenantId, edges, relatedId);
        List<ItemParentResponse> result = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();
        for (CatalogItemEdge edge : edges) {
            UUID id = relatedId.apply(edge);
            CatalogItem related = relatedById.get(id);
            if (related == null || !seen.add(id)) {
                continue;
            }
            result.add(link(edge, related));
        }
        return result;
    }

    private static int resolveMaxDepth(CatalogType type, Integer depth) {
        if (depth != null && depth > 0) {
            return depth;
        }
        if (type.maxDepth != null && type.maxDepth > 0) {
            return type.maxDepth;
        }
        return CatalogSupport.DEFAULT_MAX_DEPTH;
    }

    private void flushWindowGuard() {
        try {
            entityManager.flush();
        } catch (PersistenceException e) {
            if (causeChain(e).contains("ex_catalog_item_window")) {
                throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_ITEM_WINDOW_OVERLAP, Map.of());
            }
            throw e;
        }
    }

    private static String causeChain(Throwable failure) {
        StringBuilder messages = new StringBuilder();
        for (Throwable current = failure; current != null; current = current.getCause()) {
            messages.append(current.getMessage()).append('\n');
            if (current.getCause() == current) {
                break;
            }
        }
        return messages.toString();
    }

    private static void applyCreate(CatalogItem item, ItemCreateRequest request) {
        item.name = CatalogSupport.requireText(request.name(), ResponseKey.NAME.getKey());
        item.nameEn = trimToNull(request.nameEn());
        item.description = trimToNull(request.description());
        item.attributes = request.attributes();
        item.sortOrder = request.sortOrder() != null ? request.sortOrder() : 0;
        item.status = CatalogSupport.parseEnum(CatalogStatus.class, request.status(), "status", CatalogStatus.ACTIVE);
        item.createdAt = Instant.now();
        item.updatedAt = item.createdAt;
    }

    private static void applyUpdate(CatalogItem next, ItemUpdateRequest request, CatalogItem current) {
        next.name = request.name() != null
            ? CatalogSupport.requireText(request.name(), ResponseKey.NAME.getKey())
            : current.name;
        next.nameEn = request.nameEn() != null ? trimToNull(request.nameEn()) : current.nameEn;
        next.description = request.description() != null ? trimToNull(request.description()) : current.description;
        next.attributes = request.attributes() != null ? request.attributes() : current.attributes;
        next.sortOrder = request.sortOrder() != null ? request.sortOrder() : current.sortOrder;
        next.status = request.status() != null
            ? CatalogSupport.parseEnum(CatalogStatus.class, request.status(), "status", current.status)
            : current.status;
        next.createdAt = Instant.now();
        next.updatedAt = next.createdAt;
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    static ItemResponse toResponse(CatalogItem item, String typeCode) {
        return toResponse(item, typeCode, false);
    }

    static ItemResponse toResponse(CatalogItem item, String typeCode, boolean overridden) {
        return new ItemResponse(
            item.id,
            item.typeId,
            typeCode,
            item.code,
            item.name,
            item.nameEn,
            item.description,
            item.attributes,
            item.sortOrder,
            item.status.name(),
            item.version,
            item.versionGroupId,
            item.validFrom,
            item.validTo,
            item.supersedesItemId,
            item.tenantId == null,
            overridden,
            item.createdAt,
            item.updatedAt,
            null,
            null);
    }

    static ItemResponse toResponse(CatalogItem item, String typeCode, boolean overridden,
                                   List<ItemParentResponse> parents, List<ItemParentResponse> children) {
        return new ItemResponse(
            item.id, item.typeId, typeCode, item.code, item.name, item.nameEn, item.description,
            item.attributes, item.sortOrder, item.status.name(), item.version, item.versionGroupId,
            item.validFrom, item.validTo, item.supersedesItemId, item.tenantId == null,
            overridden, item.createdAt, item.updatedAt, parents, children);
    }
}
