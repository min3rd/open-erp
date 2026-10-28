package com.vn9melody.openerp.plugins.catalog.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugins.catalog.cache.CatalogCache;
import com.vn9melody.openerp.plugins.catalog.service.AuditTrail;
import com.vn9melody.openerp.plugins.catalog.api.CatalogHierarchyMode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.api.PlatformAction;
import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogSupport;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogLookupDtos.InlineCreateRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogLookupDtos.LookupTypeResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogLookupDtos.OptionResponse;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogLookupDtos.ResolveRequest;
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
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;

/**
 * Lookup APIs for dynamic forms (TASK-381 / TASK-391 / DES-API-S05-001 section 4):
 * renderer schema, merged lazy options (tenant row wins, INACTIVE tenant row hides
 * a system code for that tenant only), batch resolve, breadcrumb path and inline
 * quick-create.
 */
@ApplicationScoped
public class CatalogLookupService {

    private static final int MAX_PATH_DEPTH = 32;

    @Inject
    CatalogGateway gateway;

    @Inject
    CatalogCache cache;

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    AuditTrail auditTrail;

    /** Types usable by the form renderer: tenant override wins per code (DES-API section 5.1). */
    public List<LookupTypeResponse> types(UUID tenantId) {
        return cache.getOrLoad(tenantId, "lookup:types",
                new TypeReference<List<LookupTypeResponse>>() {},
                () -> loadTypes(tenantId));
    }

    private List<LookupTypeResponse> loadTypes(UUID tenantId) {
        Map<String, CatalogType> byCode = new TreeMap<>();
        for (CatalogType type : gateway.visibleTypes(tenantId)) {
            if (type.status != CatalogStatus.ACTIVE) {
                continue;
            }
            CatalogType existing = byCode.get(type.code);
            if (existing == null || type.tenantId != null) {
                byCode.put(type.code, type);
            }
        }
        return byCode.values().stream().map(CatalogLookupService::toLookupType).toList();
    }

    /** Paginated merged options (DES-DB T4.3). */
    public PagedData<OptionResponse> options(UUID tenantId, String typeCode, String q, String parentIdText,
                                             String asOfText, int page, int size) {
        CatalogType type = guard.requireVisibleType(tenantId, typeCode);
        int resolvedPage = CatalogSupport.page(page);
        int resolvedSize = CatalogSupport.size(size);
        String key = "lookup:options:" + CatalogCache.hash(typeCode, q, parentIdText, asOfText,
                resolvedPage, resolvedSize);
        return cache.getOrLoad(tenantId, key, new TypeReference<PagedData<OptionResponse>>() {},
                () -> loadOptions(tenantId, type, q, parentIdText, asOfText, resolvedPage, resolvedSize));
    }

    private PagedData<OptionResponse> loadOptions(UUID tenantId, CatalogType type, String q, String parentIdText,
                                                  String asOfText, int page, int size) {
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        UUID parentId = CatalogSupport.parseUuid(parentIdText, "parent_id");
        CatalogGateway.Page<CatalogItem> merged = gateway.mergedOptions(tenantId, type.id, asOf, q, parentId,
                page, size);
        return PagedData.of(enrich(merged.items(), type, tenantId, asOf), page, size, merged.total());
    }

    /** Batch resolve of stored form values; no N+1. */
    public List<OptionResponse> resolve(UUID tenantId, String typeCode, ResolveRequest request, String asOfText) {
        CatalogType type = guard.requireVisibleType(tenantId, typeCode);
        List<UUID> ids = new ArrayList<>();
        if (request != null && request.ids() != null) {
            for (String raw : request.ids()) {
                UUID id = CatalogSupport.parseUuid(raw, CatalogResponseKey.IDS.getKey());
                if (id != null) {
                    ids.add(id);
                }
            }
        }
        if (ids.isEmpty()) {
            return List.of();
        }
        List<UUID> sorted = ids.stream().distinct().sorted().toList();
        String key = "lookup:resolve:" + CatalogCache.hash(typeCode, sorted, asOfText);
        return cache.getOrLoad(tenantId, key, new TypeReference<List<OptionResponse>>() {},
                () -> {
                    Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
                    List<CatalogItem> items = gateway.itemsByIds(tenantId, sorted);
                    List<CatalogItem> filtered = items.stream()
                            .filter(item -> type.id.equals(item.typeId))
                            .toList();
                    return enrich(filtered, type, tenantId, asOf);
                });
    }

    /** Ancestor breadcrumb of one item, root first and ending with the item itself. */
    public List<OptionResponse> path(UUID tenantId, String typeCode, String itemIdText, String asOfText) {
        CatalogType type = guard.requireVisibleType(tenantId, typeCode);
        UUID itemId = CatalogSupport.parseUuid(itemIdText, ResponseKey.ID.getKey());
        if (itemId == null) {
            throw CatalogSupport.validation(ResponseKey.ID.getKey(), ErrorCode.VALIDATION_REQUIRED, Map.of());
        }
        String key = "lookup:path:" + CatalogCache.hash(typeCode, itemId, asOfText);
        return cache.getOrLoad(tenantId, key, new TypeReference<List<OptionResponse>>() {},
                () -> loadPath(tenantId, type, itemId, asOfText));
    }

    private List<OptionResponse> loadPath(UUID tenantId, CatalogType type, UUID itemId, String asOfText) {
        Instant asOf = CatalogSupport.parseInstant(asOfText, "as_of", Instant.now());
        CatalogItem item = requireVisibleItem(tenantId, itemId);
        CatalogType itemType = gateway.typeById(tenantId, item.typeId);
        if (itemType == null || !itemType.code.equals(type.code)) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_ITEM_NOT_FOUND,
                ResponseKey.ID.getKey(), itemId);
        }
        guard.requireTypeAccess(tenantId, type, CatalogPermissionGuard.Access.READ);

        List<CatalogItem> chain = new ArrayList<>();
        Set<UUID> visited = new HashSet<>();
        CatalogItem current = item;
        int guardDepth = 0;
        while (current != null && guardDepth++ < MAX_PATH_DEPTH) {
            List<CatalogItemEdge> edges = gateway.edgesByChild(tenantId, current.id, asOf);
            if (edges.isEmpty()) {
                break;
            }
            UUID parentId = edges.get(0).parentItemId;
            if (!visited.add(parentId)) {
                break;
            }
            CatalogItem parent = gateway.itemById(tenantId, parentId);
            if (parent == null) {
                break;
            }
            chain.add(0, parent);
            current = parent;
        }
        chain.add(item);
        return enrich(chain, type, tenantId, asOf);
    }

    /** Quick-create from free text; code/name duplicates are rejected with a dedicated code. */
    public OptionResponse inline(UUID tenantId, String typeCode, InlineCreateRequest request) {
        CatalogType type = guard.requireVisibleType(tenantId, typeCode);
        if (!type.allowFreeText) {
            throw new ApiException(400, CatalogErrorCode.CATALOG_LOOKUP_INLINE_NOT_ALLOWED,
                "This catalog type does not allow free text quick-create",
                Map.of(ResponseKey.CODE.getKey(), type.code));
        }
        String name = CatalogSupport.requireText(request.name(), ResponseKey.NAME.getKey());
        if (tenantId != null && type.tenantId != null) {
            guard.requireTypeAccess(tenantId, type, CatalogPermissionGuard.Access.WRITE);
        }
        String code = CatalogSupport.normalizeCode(request.code());
        if (code == null) {
            code = deriveCode(name);
        }
        if (gateway.visibleCurrentByCodeOrName(tenantId, type.id, code, name) != null) {
            throw CatalogSupport.conflict(CatalogErrorCode.CATALOG_LOOKUP_INLINE_DUPLICATE,
                Map.of(ResponseKey.CODE.getKey(), code, ResponseKey.NAME.getKey(), name));
        }

        CatalogItem item = new CatalogItem();
        item.tenantId = tenantId;
        item.typeId = type.id;
        item.versionGroupId = UUID.randomUUID();
        item.version = 1;
        item.code = code;
        item.name = name;
        item.status = CatalogStatus.ACTIVE;
        item.sortOrder = 0;
        item.createdBy = auditTrail.currentActorUserId();
        item.updatedBy = item.createdBy;
        item.validFrom = Instant.now();
        item.createdAt = item.validFrom;
        item.updatedAt = item.validFrom;
        CatalogItem saved = gateway.insertItem(tenantId, item, tenantId == null);

        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_ITEM_CREATE, "CATALOG_ITEM", saved.id,
            Map.of(ResponseKey.CODE.getKey(), saved.code));
        return enrich(List.of(saved), type, tenantId, Instant.now()).get(0);
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private List<OptionResponse> enrich(List<CatalogItem> items, CatalogType type, UUID tenantId, Instant asOf) {
        if (items.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = items.stream().map(item -> item.id).toList();
        Set<String> codes = new LinkedHashSet<>(items.stream().map(item -> item.code).toList());
        UUID systemTypeId = type.tenantId == null ? type.id : gateway.systemTypeId(type.code);
        Set<String> systemCodes = systemTypeId == null ? Set.of()
            : gateway.systemCodes(tenantId, systemTypeId, asOf, codes);
        Set<UUID> withChildren = new HashSet<>(gateway.parentIdsWithChildren(tenantId, ids, asOf));
        Map<UUID, UUID> firstParent = new HashMap<>();
        if (type.hierarchyMode != CatalogHierarchyMode.FLAT) {
            for (CatalogItemEdge edge : gateway.edgesByChildren(tenantId, ids, asOf)) {
                firstParent.putIfAbsent(edge.childItemId, edge.parentItemId);
            }
        }
        Map<UUID, String> paths = type.hierarchyMode != CatalogHierarchyMode.FLAT
            ? buildPaths(items, tenantId, asOf)
            : Map.of();

        return items.stream()
            .map(item -> new OptionResponse(
                item.id,
                item.code,
                item.name,
                firstParent.get(item.id),
                paths.get(item.id),
                withChildren.contains(item.id),
                item.tenantId == null,
                item.tenantId != null && systemCodes.contains(item.code),
                type.allowFreeText))
            .toList();
    }

    /** Root-first names of the first parent chain of each item (bounded by MAX_PATH_DEPTH). */
    private Map<UUID, String> buildPaths(List<CatalogItem> items, UUID tenantId, Instant asOf) {
        Map<UUID, CatalogItem> known = new LinkedHashMap<>();
        for (CatalogItem item : items) {
            known.put(item.id, item);
        }
        Map<UUID, List<UUID>> parentsByChild = new HashMap<>();
        Set<UUID> pending = new LinkedHashSet<>(known.keySet());
        int guardDepth = 0;
        while (!pending.isEmpty() && guardDepth++ < MAX_PATH_DEPTH) {
            List<CatalogItemEdge> edges = gateway.edgesByChildren(tenantId, pending, asOf);
            Set<UUID> missing = new LinkedHashSet<>();
            for (CatalogItemEdge edge : edges) {
                parentsByChild.computeIfAbsent(edge.childItemId, key -> new ArrayList<>())
                    .add(edge.parentItemId);
                if (!known.containsKey(edge.parentItemId)) {
                    missing.add(edge.parentItemId);
                }
            }
            if (missing.isEmpty()) {
                break;
            }
            for (CatalogItem parent : gateway.itemsByIds(tenantId, missing)) {
                known.put(parent.id, parent);
            }
            pending = missing;
        }

        Map<UUID, String> paths = new HashMap<>();
        for (CatalogItem item : items) {
            List<String> names = new ArrayList<>();
            Set<UUID> visited = new HashSet<>();
            UUID current = item.id;
            int depthGuard = 0;
            while (depthGuard++ < MAX_PATH_DEPTH) {
                List<UUID> parents = parentsByChild.get(current);
                if (parents == null || parents.isEmpty()) {
                    break;
                }
                UUID parentId = parents.get(0);
                if (!visited.add(parentId)) {
                    break;
                }
                CatalogItem parent = known.get(parentId);
                if (parent == null) {
                    break;
                }
                names.add(0, parent.name);
                current = parentId;
            }
            if (!names.isEmpty()) {
                paths.put(item.id, String.join(" / ", names));
            }
        }
        return paths;
    }

    private CatalogItem requireVisibleItem(UUID tenantId, UUID itemId) {
        CatalogItem item = gateway.itemById(tenantId, itemId);
        if (item == null) {
            throw CatalogSupport.notFound(CatalogErrorCode.CATALOG_ITEM_NOT_FOUND,
                ResponseKey.ID.getKey(), itemId);
        }
        return item;
    }

    /** UPPER_SNAKE code derived from a free-text name (max 64 chars). */
    static String deriveCode(String name) {
        StringBuilder builder = new StringBuilder();
        for (char c : name.toUpperCase().toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                builder.append(c);
            } else if (builder.length() > 0 && builder.charAt(builder.length() - 1) != '_') {
                builder.append('_');
            }
        }
        String code = builder.toString().replaceAll("_+$", "");
        if (code.isEmpty()) {
            code = "ITEM";
        }
        return code.length() > CatalogSupport.MAX_CODE_LENGTH
            ? code.substring(0, CatalogSupport.MAX_CODE_LENGTH)
            : code;
    }

    private static LookupTypeResponse toLookupType(CatalogType type) {
        String parentTypeCode = type.allowedParentTypes != null && type.allowedParentTypes.length > 0
            ? type.allowedParentTypes[0]
            : null;
        return new LookupTypeResponse(type.code, type.nameKey, type.allowFreeText, type.hierarchyMode.name(),
            parentTypeCode, false, type.attributesSchema);
    }
}
