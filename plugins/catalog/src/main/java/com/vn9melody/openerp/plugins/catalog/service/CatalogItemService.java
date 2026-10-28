package com.vn9melody.openerp.plugins.catalog.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugins.catalog.service.AuditTrail;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.api.PlatformAction;
import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogSupport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemParentResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogItemDtos.ItemUpdateRequest;
import com.vn9melody.openerp.plugins.catalog.gateway.CatalogGateway;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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
    CatalogGateway gateway;

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    AuditTrail auditTrail;

    public record ItemPage(List<ItemResponse> items, long total) {}

    public List<ItemResponse> list(UUID tenantId, String typeCode, String q, String parentIdText,
                                   String relationType, String asOfText, String status, int page, int size) {
        return page(tenantId, typeCode, q, parentIdText, relationType, asOfText, status, page, size, null, null)
                .items();
    }

    public long count(UUID tenantId, String typeCode, String q, String parentIdText, String relationType,
                      String asOfText, String status) {
        return page(tenantId, typeCode, q, parentIdText, relationType, asOfText, status, 0, 1, null, null)
                .total();
    }

    public ItemPage page(UUID tenantId, String typeCode, String q, String parentIdText, String relationType,
                         String asOfText, String status, int page, int size, String sort, String direction) {
        CatalogType type = guard.requireTypeAccess(tenantId, typeCode, CatalogPermissionGuard.Access.READ);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        UUID parentId = CatalogSupport.parseUuid(parentIdText, "parent_id");
        int resolvedPage = CatalogSupport.page(page);
        int resolvedSize = CatalogSupport.size(size);
        CatalogGateway.Page<CatalogItem> result = gateway.adminPage(tenantId, type.id, asOf, q, status,
                parentId, relationType, resolvedPage, resolvedSize, sort, direction);

        Set<String> codes = new LinkedHashSet<>();
        for (CatalogItem item : result.items()) {
            codes.add(item.code);
        }
        UUID systemTypeId = type.tenantId == null ? type.id : gateway.systemTypeId(type.code);
        Set<String> systemCodes = systemTypeId == null ? Set.of()
                : gateway.systemCodes(tenantId, systemTypeId, asOf, codes);
        Map<UUID, List<ItemParentResponse>> parentsByItem = new HashMap<>();
        List<CatalogItemEdge> edges = gateway.edgesByChildren(tenantId,
                result.items().stream().map(item -> item.id).toList(), asOf);
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
        List<ItemResponse> items = result.items().stream()
            .map(item -> toResponse(item, type.code,
                item.tenantId != null && systemCodes.contains(item.code),
                parentsByItem.getOrDefault(item.id, List.of()), List.of()))
            .toList();
        return new ItemPage(items, result.total());
    }

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
        if (gateway.currentItemByCode(tenantId, type.id, code, tenantId == null) != null) {
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
        item.createdAt = item.validFrom;
        item.updatedAt = item.validFrom;
        CatalogItem saved = gateway.insertItem(tenantId, itemParams(item), tenantId == null);

        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_ITEM_CREATE, "CATALOG_ITEM", saved.id,
            Map.of(ResponseKey.CODE.getKey(), saved.code));
        return toResponse(saved, type.code, isOverridden(tenantId, saved, type, saved.validFrom));
    }

    public ItemResponse update(UUID tenantId, UUID itemId, ItemUpdateRequest request) {
        CatalogItem item = requireWritableItem(tenantId, itemId);
        CatalogType type = requireType(tenantId, item.typeId);
        requireItemWriteGrant(tenantId, type);

        Instant now = Instant.now();
        UUID actor = auditTrail.currentActorUserId();

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
        next.createdAt = now;
        next.updatedBy = actor;
        next.updatedAt = now;
        CatalogItem saved = gateway.updateItemVersioned(tenantId, item, next, now, actor);

        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_ITEM_UPDATE, "CATALOG_ITEM", saved.id,
            Map.of(ResponseKey.CODE.getKey(), saved.code));
        return toResponse(saved, type.code, isOverridden(tenantId, saved, type, now));
    }

    public void close(UUID tenantId, UUID itemId) {
        CatalogItem item = requireWritableItem(tenantId, itemId);
        CatalogType type = requireType(tenantId, item.typeId);
        requireItemWriteGrant(tenantId, type);

        Instant now = Instant.now();
        UUID actor = auditTrail.currentActorUserId();
        gateway.closeItem(tenantId, item.id, now, actor, item.tenantId == null);
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_ITEM_CLOSE, "CATALOG_ITEM", item.id,
            Map.of(ResponseKey.CODE.getKey(), item.code));
    }

    public ItemResponse get(UUID tenantId, UUID itemId, String asOfText, boolean withRelations) {
        CatalogItem item = requireReadableItem(tenantId, itemId);
        CatalogType type = requireType(tenantId, item.typeId);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        boolean overridden = isOverridden(tenantId, item, type, asOf);
        if (!withRelations) {
            return toResponse(item, type.code, overridden);
        }
        return toResponse(item, type.code, overridden, parents(tenantId, itemId, asOfText),
            directChildren(tenantId, item, asOf));
    }

    public List<ItemResponse> versions(UUID tenantId, UUID itemId) {
        CatalogItem item = requireReadableItem(tenantId, itemId);
        CatalogType type = requireType(tenantId, item.typeId);
        boolean overridden = isOverridden(tenantId, item, type, Instant.now());
        return gateway.itemVersions(tenantId, item.versionGroupId).stream()
            .map(version -> toResponse(version, type.code, overridden))
            .toList();
    }

    public List<ItemParentResponse> parents(UUID tenantId, UUID itemId, String asOfText) {
        requireReadableItem(tenantId, itemId);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        List<CatalogItemEdge> edges = gateway.edgesByChild(tenantId, itemId, asOf);
        return toLinks(edges, tenantId, edge -> edge.parentItemId);
    }

    public List<ItemResponse> descendants(UUID tenantId, UUID itemId, String asOfText, Integer depth) {
        CatalogItem item = requireReadableItem(tenantId, itemId);
        CatalogType type = requireType(tenantId, item.typeId);
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of",
                Instant.now());
        int maxDepth = resolveMaxDepth(type, depth);
        return gateway.descendants(tenantId, itemId, asOf, maxDepth).stream()
            .map(descendant -> toResponse(descendant, type.code))
            .toList();
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private List<ItemParentResponse> directChildren(UUID tenantId, CatalogItem item, Instant asOf) {
        List<CatalogItemEdge> edges = gateway.edgesByParent(tenantId, item.id, asOf);
        return toLinks(edges, tenantId, edge -> edge.childItemId);
    }

    private CatalogItem requireReadableItem(UUID tenantId, UUID itemId) {
        CatalogItem item = gateway.itemById(tenantId, itemId);
        if (item == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_ITEM_NOT_FOUND,
                ResponseKey.ID.getKey(), itemId);
        }
        CatalogType type = requireType(tenantId, item.typeId);
        guard.requireTypeAccess(tenantId, type, CatalogPermissionGuard.Access.READ);
        return item;
    }

    private CatalogItem requireWritableItem(UUID tenantId, UUID itemId) {
        CatalogItem item = gateway.itemById(tenantId, itemId);
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

    private static Map<String, Object> itemParams(CatalogItem item) {
        Map<String, Object> params = new java.util.LinkedHashMap<>();
        params.put("type_id", item.typeId);
        params.put("version_group_id", item.versionGroupId);
        params.put("version", item.version);
        params.put("code", item.code);
        params.put("name", item.name);
        params.put("name_en", item.nameEn);
        params.put("description", item.description);
        params.put("attributes", item.attributes);
        params.put("sort_order", item.sortOrder);
        params.put("status", item.status == null ? null : item.status.name());
        params.put("valid_from", item.validFrom);
        params.put("valid_to", item.validTo);
        params.put("supersedes_item_id", item.supersedesItemId);
        params.put("created_by", item.createdBy);
        params.put("created_at", item.createdAt);
        params.put("updated_by", item.updatedBy);
        params.put("updated_at", item.updatedAt);
        return params;
    }

    private void requireItemWriteGrant(UUID tenantId, CatalogType type) {
        if (tenantId != null && type.tenantId != null) {
            guard.requireTypeAccess(tenantId, type, CatalogPermissionGuard.Access.WRITE);
        }
    }

    private CatalogType requireType(UUID tenantId, UUID typeId) {
        CatalogType type = gateway.typeById(tenantId, typeId);
        if (type == null) {
            throw CatalogTypeService.notFound(ResponseKey.ID.getKey(), typeId);
        }
        return type;
    }

    /** True when the tenant row shadows an active system row with the same code. */
    private boolean isOverridden(UUID tenantId, CatalogItem item, CatalogType type, Instant asOf) {
        if (tenantId == null || item.tenantId == null) {
            return false;
        }
        UUID systemTypeId = type.tenantId == null ? type.id : gateway.systemTypeId(type.code);
        return systemTypeId != null
                && gateway.systemCodes(tenantId, systemTypeId, asOf, Set.of(item.code)).contains(item.code);
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
        for (CatalogItem item : gateway.itemsByIds(tenantId,
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
