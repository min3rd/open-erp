package com.vn9melody.openerp.plugins.catalog.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.api.PlatformAction;
import com.vn9melody.openerp.plugins.catalog.cache.CatalogCache;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.CloneResult;
import com.vn9melody.openerp.plugins.catalog.gateway.CatalogGateway;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import com.vn9melody.openerp.plugins.catalog.model.CatalogTypeRelation;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * FEAT-32: clones a system type cluster (connected through type relations) into
 * the tenant schema and removes it again. Clone is idempotent; tenant rows keep
 * a {@code system_*_id} pointer for later sync.
 */
@ApplicationScoped
public class CatalogCloneService {

    private static final int CHUNK = 500;

    @Inject
    CatalogGateway gateway;

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    CatalogCache cache;

    @Inject
    AuditTrail auditTrail;

    @Inject
    CatalogTypeService typeService;

    public CloneResult clone(UUID tenantId, String code) {
        cache.invalidate(tenantId);
        CatalogType visible = guard.requireVisibleType(tenantId, code);
        UUID systemRoot = visible.tenantId == null ? visible.id : visible.systemTypeId;
        if (systemRoot == null) {
            throw new ApiException(409, CatalogErrorCode.CATALOG_TYPE_NOT_SYSTEM,
                    "Only system catalog types can be cloned");
        }

        Map<UUID, CatalogType> systemTypes = new HashMap<>();
        gateway.systemTypes().forEach(type -> systemTypes.put(type.id, type));
        Set<UUID> component = component(systemRoot,
                gateway.allTypeRelations(tenantId).stream().filter(relation -> relation.tenantId == null).toList());
        Instant now = Instant.now();

        Map<String, CatalogType> tenantTypeByCode = new HashMap<>();
        for (CatalogType type : gateway.visibleTypes(tenantId)) {
            if (Objects.equals(type.tenantId, tenantId)) {
                tenantTypeByCode.put(type.code, type);
            }
        }

        int types = 0;
        int skipped = 0;
        Map<UUID, UUID> tenantTypeBySystem = new HashMap<>();
        for (UUID systemTypeId : component) {
            CatalogType systemType = systemTypes.get(systemTypeId);
            if (systemType == null) {
                skipped++;
                continue;
            }
            CatalogType tenantType = tenantTypeByCode.get(systemType.code);
            if (tenantType == null) {
                tenantType = gateway.insertType(tenantId, cloneTypeParams(systemType, systemTypeId, now), false);
                tenantTypeByCode.put(systemType.code, tenantType);
                types++;
            } else if (tenantType.systemTypeId == null) {
                Map<String, Object> params = typeParams(tenantType);
                params.put("system_type_id", systemTypeId);
                params.put("updated_at", now);
                tenantType = gateway.updateType(tenantId, params, false);
                tenantTypeByCode.put(systemType.code, tenantType);
                types++;
            } else if (!tenantType.systemTypeId.equals(systemTypeId)) {
                skipped++;
                continue;
            }
            tenantTypeBySystem.put(systemTypeId, tenantType.id);
            if (gateway.grantsByType(tenantId, tenantType.id).isEmpty()) {
                typeService.createDefaultGrants(tenantId, tenantType.id);
            }
            if (!tenantType.id.equals(systemType.id)) {
                gateway.moveItemsToType(tenantId, systemType.id, tenantType.id);
            }
        }

        Map<UUID, UUID> tenantItemBySystem = new HashMap<>();
        Map<UUID, CatalogItem> tenantItemById = new HashMap<>();
        int items = 0;
        for (Map.Entry<UUID, UUID> entry : tenantTypeBySystem.entrySet()) {
            CatalogType systemType = systemTypes.get(entry.getKey());
            List<CatalogItem> systemItems = gateway.cloneItems(tenantId, systemType.id, true);
            List<CatalogItem> tenantItems = gateway.cloneItems(tenantId, entry.getValue(), false);
            List<CatalogItem> tenantOverrides = gateway.cloneItems(tenantId, systemType.id, false);
            Set<String> overriddenCodes = new HashSet<>();
            for (CatalogItem item : tenantItems) {
                overriddenCodes.add(item.code);
                tenantItemById.put(item.id, item);
                if (item.systemItemId != null) {
                    tenantItemBySystem.put(item.systemItemId, item.id);
                }
            }
            Map<String, CatalogItem> systemByCode = new HashMap<>();
            for (CatalogItem systemItem : systemItems) {
                systemByCode.put(systemItem.code, systemItem);
            }
            for (CatalogItem item : tenantItems) {
                if (item.systemItemId == null) {
                    CatalogItem systemItem = systemByCode.get(item.code);
                    if (systemItem != null) {
                        tenantItemBySystem.put(systemItem.id, item.id);
                    }
                }
            }
            for (CatalogItem item : tenantOverrides) {
                overriddenCodes.add(item.code);
            }
            Map<String, UUID> versionGroupByCode = new HashMap<>();
            List<CatalogItem> copies = new ArrayList<>();
            for (CatalogItem systemItem : systemItems) {
                if (systemItem.tenantId != null || overriddenCodes.contains(systemItem.code)) {
                    continue;
                }
                copies.add(copyItem(systemItem, entry.getValue(),
                        versionGroupByCode.computeIfAbsent(systemItem.code, key -> UUID.randomUUID())));
            }
            List<CatalogItem> saved = gateway.insertItems(tenantId, copies);
            for (int index = 0; index < copies.size(); index++) {
                CatalogItem source = copies.get(index);
                CatalogItem target = saved.get(index);
                tenantItemById.put(target.id, target);
                tenantItemBySystem.put(source.systemItemId, target.id);
                items++;
            }
        }

        Set<String> tenantEdges = new HashSet<>();
        for (CatalogItemEdge edge : gateway.cloneEdges(tenantId, false)) {
            tenantEdges.add(edgeKey(edge));
        }
        List<PluginDataClient.BatchStatement> edgeWrites = new ArrayList<>();
        Map<UUID, CatalogItem> tenantItemByCodeType = new HashMap<>();
        for (CatalogItem item : tenantItemById.values()) {
            tenantItemByCodeType.put(item.id, item);
        }
        int edges = 0;
        for (CatalogItemEdge systemEdge : gateway.cloneEdges(tenantId, true)) {
            if (systemEdge.tenantId != null) {
                continue;
            }
            UUID parent = tenantItemBySystem.get(systemEdge.parentItemId);
            UUID child = tenantItemBySystem.get(systemEdge.childItemId);
            if (parent == null || child == null) {
                skipped++;
                continue;
            }
            String key = edgeKey(parent, child, systemEdge.relationType);
            if (tenantEdges.contains(key)) {
                continue;
            }
            Map<String, Object> params = edgeParams(parent, child, systemEdge);
            edgeWrites.add(new PluginDataClient.BatchStatement("catalog.edge.insert", params));
            tenantEdges.add(key);
            edges++;
        }
        runBatches(edgeWrites);

        Set<String> tenantRelations = new HashSet<>();
        for (CatalogTypeRelation relation : gateway.allTypeRelations(tenantId)) {
            if (Objects.equals(relation.tenantId, tenantId)) {
                tenantRelations.add(relationKey(relation.parentTypeId, relation.childTypeId, relation.relationType));
            }
        }
        List<PluginDataClient.BatchStatement> relationWrites = new ArrayList<>();
        int relations = 0;
        for (CatalogTypeRelation systemRelation : gateway.allTypeRelations(tenantId)) {
            if (systemRelation.tenantId != null) {
                continue;
            }
            UUID parent = tenantTypeBySystem.get(systemRelation.parentTypeId);
            UUID child = tenantTypeBySystem.get(systemRelation.childTypeId);
            if (parent == null || child == null) {
                continue;
            }
            String key = relationKey(parent, child, systemRelation.relationType);
            if (tenantRelations.contains(key)) {
                continue;
            }
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("parent_type_id", parent);
            params.put("child_type_id", child);
            params.put("relation_type", systemRelation.relationType.name());
            params.put("sort_order", systemRelation.sortOrder);
            params.put("status", CatalogStatus.ACTIVE.name());
            params.put("system_relation_id", systemRelation.id);
            params.put("created_at", now);
            params.put("updated_at", now);
            relationWrites.add(new PluginDataClient.BatchStatement("catalog.type.relation.insert", params));
            tenantRelations.add(key);
            relations++;
        }
        runBatches(relationWrites);

        cache.invalidate(tenantId);
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_TYPE_CLONE, "CATALOG_TYPE", visible.id,
                Map.of(ResponseKey.CODE.getKey(), code));
        return new CloneResult(types, items, edges, relations, skipped,
                tenantTypeBySystem.get(systemRoot));
    }

    public CloneResult deleteClone(UUID tenantId, String code) {
        cache.invalidate(tenantId);
        CatalogType visible = guard.requireVisibleType(tenantId, code);
        if (!Objects.equals(visible.tenantId, tenantId) || visible.systemTypeId == null) {
            throw new ApiException(409, CatalogErrorCode.CATALOG_TYPE_NOT_CLONED,
                    "Catalog type is not a tenant clone");
        }
        Map<UUID, CatalogType> systemTypes = new HashMap<>();
        gateway.systemTypes().forEach(type -> systemTypes.put(type.id, type));
        Set<UUID> component = component(visible.systemTypeId,
                gateway.allTypeRelations(tenantId).stream().filter(relation -> relation.tenantId == null).toList());

        List<CatalogType> cloneTypes = gateway.visibleTypes(tenantId).stream()
                .filter(type -> Objects.equals(type.tenantId, tenantId))
                .filter(type -> type.systemTypeId != null && component.contains(type.systemTypeId))
                .toList();

        int types = 0;
        int items = 0;
        int edges = 0;
        for (CatalogType cloneType : cloneTypes) {
            List<CatalogItem> typeItems = gateway.cloneItems(tenantId, cloneType.id, false);
            List<UUID> itemIds = typeItems.stream().map(item -> item.id).toList();
            List<PluginDataClient.BatchStatement> deletes = new ArrayList<>();
            for (int start = 0; start < itemIds.size(); start += CHUNK) {
                List<UUID> chunk = itemIds.subList(start, Math.min(itemIds.size(), start + CHUNK));
                deletes.add(new PluginDataClient.BatchStatement("catalog.clone.edge.delete.by.parents",
                        Map.of("parent_item_ids", chunk)));
                deletes.add(new PluginDataClient.BatchStatement("catalog.clone.edge.delete.by.children",
                        Map.of("child_item_ids", chunk)));
            }
            deletes.add(new PluginDataClient.BatchStatement("catalog.clone.item.delete.by.type",
                    Map.of("type_id", cloneType.id)));
            runBatches(deletes);
            gateway.batch(List.of(new PluginDataClient.BatchStatement("catalog.clone.type.delete",
                    Map.of("id", cloneType.id))));
            items += typeItems.size();
            edges += 0;
            types++;
        }
        cache.invalidate(tenantId);
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_TYPE_CLONE_DELETE, "CATALOG_TYPE", visible.id,
                Map.of(ResponseKey.CODE.getKey(), code));
        return new CloneResult(types, items, edges, 0, 0, null);
    }

    static Set<UUID> component(UUID root, List<CatalogTypeRelation> relations) {
        Map<UUID, Set<UUID>> adjacency = new HashMap<>();
        for (CatalogTypeRelation relation : relations) {
            adjacency.computeIfAbsent(relation.parentTypeId, key -> new HashSet<>()).add(relation.childTypeId);
            adjacency.computeIfAbsent(relation.childTypeId, key -> new HashSet<>()).add(relation.parentTypeId);
        }
        Set<UUID> visited = new HashSet<>();
        ArrayDeque<UUID> pending = new ArrayDeque<>();
        pending.add(root);
        while (!pending.isEmpty()) {
            UUID current = pending.poll();
            if (!visited.add(current)) {
                continue;
            }
            for (UUID next : adjacency.getOrDefault(current, Set.of())) {
                if (!visited.contains(next)) {
                    pending.add(next);
                }
            }
        }
        return visited;
    }

    private static CatalogItem copyItem(CatalogItem source, UUID typeId, UUID versionGroupId) {
        CatalogItem item = new CatalogItem();
        item.typeId = typeId;
        item.systemItemId = source.id;
        item.versionGroupId = versionGroupId;
        item.version = source.version;
        item.code = source.code;
        item.name = source.name;
        item.nameEn = source.nameEn;
        item.description = source.description;
        item.attributes = source.attributes;
        item.sortOrder = source.sortOrder;
        item.status = source.status;
        item.validFrom = source.validFrom;
        item.validTo = source.validTo;
        item.createdAt = source.createdAt;
        item.updatedAt = source.updatedAt;
        return item;
    }

    private static Map<String, Object> cloneTypeParams(CatalogType source, UUID systemTypeId, Instant now) {
        Map<String, Object> params = typeParams(source);
        params.remove("id");
        params.put("system_type_id", systemTypeId);
        params.put("created_at", now);
        params.put("updated_at", now);
        return params;
    }

    private static Map<String, Object> typeParams(CatalogType type) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", type.id);
        params.put("code", type.code);
        params.put("system_type_id", type.systemTypeId);
        params.put("name_key", type.nameKey);
        params.put("description_key", type.descriptionKey);
        params.put("hierarchy_mode", type.hierarchyMode == null ? null : type.hierarchyMode.name());
        params.put("allowed_relations", type.allowedRelations == null ? null : List.of(type.allowedRelations));
        params.put("allowed_parent_types", type.allowedParentTypes == null ? null : List.of(type.allowedParentTypes));
        params.put("max_depth", type.maxDepth);
        params.put("min_parents", type.minParents);
        params.put("allow_free_text", type.allowFreeText);
        params.put("versioned", type.versioned);
        params.put("effective_dated", type.effectiveDated);
        params.put("attributes_schema", type.attributesSchema);
        params.put("status", type.status == null ? null : type.status.name());
        params.put("updated_at", type.updatedAt);
        return params;
    }

    private static Map<String, Object> edgeParams(UUID parent, UUID child, CatalogItemEdge source) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("parent_item_id", parent);
        params.put("child_item_id", child);
        params.put("system_edge_id", source.id);
        params.put("relation_type", source.relationType.name());
        params.put("sort_order", source.sortOrder);
        params.put("status", source.status == null ? CatalogStatus.ACTIVE.name() : source.status.name());
        params.put("valid_from", source.validFrom == null ? Instant.now() : source.validFrom);
        params.put("valid_to", source.validTo);
        params.put("created_at", Instant.now());
        return params;
    }

    private void runBatches(List<PluginDataClient.BatchStatement> statements) {
        for (int start = 0; start < statements.size(); start += CHUNK) {
            gateway.batch(statements.subList(start, Math.min(statements.size(), start + CHUNK)));
        }
    }

    private static String edgeKey(CatalogItemEdge edge) {
        return edgeKey(edge.parentItemId, edge.childItemId, edge.relationType);
    }

    private static String edgeKey(UUID parent, UUID child, CatalogRelationType relation) {
        return parent + "|" + child + "|" + (relation == null ? "HIERARCHY" : relation.name());
    }

    private static String relationKey(UUID parent, UUID child, CatalogRelationType relation) {
        return parent + "|" + child + "|" + (relation == null ? "HIERARCHY" : relation.name());
    }
}
