package com.vn9melody.openerp.plugins.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.api.PlatformAction;
import com.vn9melody.openerp.plugins.catalog.cache.CatalogCache;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.SyncAction;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.SyncApplyRequest;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.SyncApplyResult;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.SyncConflict;
import com.vn9melody.openerp.plugins.catalog.dto.CatalogCloneDtos.SyncPreview;
import com.vn9melody.openerp.plugins.catalog.gateway.CatalogGateway;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import com.vn9melody.openerp.plugins.catalog.model.CatalogTypeRelation;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
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
 * FEAT-32 sync: compares a tenant clone cluster with its system originals and
 * applies per-conflict OVERRIDE / SKIP / MERGE choices. Items and edges are
 * compared on their current (open) rows; MERGE unions JSON/array values with
 * the tenant side winning duplicate keys.
 */
@ApplicationScoped
public class CatalogSyncService {

    private static final String TYPE = "TYPE";
    private static final String ITEM = "ITEM";
    private static final String EDGE = "EDGE";
    private static final String RELATION = "RELATION";
    private static final String OVERRIDE = "OVERRIDE";
    private static final String SKIP = "SKIP";
    private static final String MERGE = "MERGE";

    @Inject
    CatalogGateway gateway;

    @Inject
    CatalogPermissionGuard guard;

    @Inject
    CatalogCache cache;

    @Inject
    AuditTrail auditTrail;

    @Inject
    ObjectMapper objectMapper;

    public SyncPreview preview(UUID tenantId, String code) {
        return new SyncPreview(conflicts(tenantId, code));
    }

    public SyncApplyResult apply(UUID tenantId, String code, SyncApplyRequest request) {
        List<SyncAction> actions = request == null || request.conflicts() == null
                ? List.of() : request.conflicts();
        Cluster cluster = load(tenantId, code);
        int applied = 0;
        int skipped = 0;

        Map<String, CatalogType> tenantByCode = tenantByCode(cluster);
        Map<UUID, CatalogItem> tenantItems = tenantItems(cluster);
        Map<String, CatalogItem> tenantItemByKey = itemByKey(cluster, tenantItems.values());
        Map<UUID, CatalogItem> systemItems = systemItems(cluster);
        Map<String, CatalogItem> systemItemByKey = itemByKey(cluster, systemItems.values());
        List<CatalogItemEdge> tenantEdges = currentTenantEdges(cluster);
        List<CatalogItemEdge> systemEdges = currentSystemEdges(cluster);
        List<CatalogTypeRelation> tenantRelations = tenantRelations(cluster);
        List<CatalogTypeRelation> systemRelations = systemRelations(cluster);

        // 1. type fields (one update per type)
        Map<String, List<SyncAction>> typeActions = group(actions, TYPE);
        for (Map.Entry<String, List<SyncAction>> entry : typeActions.entrySet()) {
            CatalogType tenant = tenantByCode.get(entry.getKey());
            CatalogType system = tenant == null || tenant.systemTypeId == null
                    ? null : cluster.systemById().get(tenant.systemTypeId);
            if (tenant == null || system == null) {
                skipped++;
                continue;
            }
            Map<String, Object> params = typeParams(tenant);
            boolean changed = false;
            for (SyncAction action : entry.getValue()) {
                if (action.field() == null || isSkip(action)) {
                    continue;
                }
                applyTypeField(params, action, tenant, system);
                changed = true;
            }
            if (changed) {
                gateway.updateType(tenantId, params, false);
                applied++;
            } else {
                skipped++;
            }
        }

        // 2. items: new rows then field updates (grouped per item)
        Map<String, List<SyncAction>> itemActions = group(actions, ITEM);
        Set<String> handledItems = new HashSet<>();
        for (Map.Entry<String, List<SyncAction>> entry : itemActions.entrySet()) {
            String key = entry.getKey();
            List<SyncAction> itemActionList = entry.getValue();
            CatalogItem systemItem = systemItemByKey.get(key);
            CatalogItem tenantItem = tenantItemByKey.get(key);
            if (systemItem == null) {
                skipped++;
                continue;
            }
            if (tenantItem == null) {
                SyncAction create = itemActionList.stream()
                        .filter(action -> action.field() == null && !isSkip(action))
                        .findFirst().orElse(null);
                if (create == null) {
                    skipped++;
                    continue;
                }
                UUID tenantTypeId = tenantTypeId(cluster, systemItem.typeId);
                if (tenantTypeId == null) {
                    skipped++;
                    continue;
                }
                gateway.insertItem(tenantId, copyItem(systemItem, tenantTypeId), false);
                applied++;
                continue;
            }
            Map<String, Object> params = itemUpdateParams(tenantItem);
            boolean changed = false;
            for (SyncAction action : itemActionList) {
                if (action.field() == null || isSkip(action)) {
                    continue;
                }
                changed |= applyItemField(params, action, systemItem);
            }
            if (changed && handledItems.add(key)) {
                gateway.write("catalog.sync.item.update", params);
                applied++;
            } else if (!changed) {
                skipped++;
            }
        }

        // 3. edges (reload tenant items because new rows may have been inserted)
        Map<String, CatalogItem> freshTenantItems = itemByKey(cluster, tenantItems(cluster).values());
        Map<String, CatalogItemEdge> tenantEdgeByKey = edgeByKey(cluster, tenantEdges);
        Map<String, CatalogItemEdge> systemEdgeByKey = edgeByKey(cluster, systemEdges);
        Map<String, List<SyncAction>> edgeActions = group(actions, EDGE);
        for (Map.Entry<String, List<SyncAction>> entry : edgeActions.entrySet()) {
            CatalogItemEdge systemEdge = systemEdgeByKey.get(entry.getKey());
            if (systemEdge == null) {
                skipped++;
                continue;
            }
            CatalogItemEdge tenantEdge = tenantEdgeByKey.get(entry.getKey());
            if (tenantEdge == null) {
                SyncAction create = entry.getValue().stream()
                        .filter(action -> action.field() == null && !isSkip(action))
                        .findFirst().orElse(null);
                if (create == null) {
                    skipped++;
                    continue;
                }
                CatalogItem systemParent = systemItems.get(systemEdge.parentItemId);
                CatalogItem systemChild = systemItems.get(systemEdge.childItemId);
                CatalogItem parent = systemParent == null ? null
                        : freshTenantItems.get(itemKey(cluster, systemParent));
                CatalogItem child = systemChild == null ? null
                        : freshTenantItems.get(itemKey(cluster, systemChild));
                if (parent == null || child == null) {
                    skipped++;
                    continue;
                }
                gateway.insertEdge(tenantId, edgeParams(parent.id, child.id, systemEdge), false);
                applied++;
                continue;
            }
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("id", tenantEdge.id);
            params.put("sort_order", tenantEdge.sortOrder);
            params.put("status", tenantEdge.status == null ? null : tenantEdge.status.name());
            boolean changed = false;
            for (SyncAction action : entry.getValue()) {
                if (action.field() == null || isSkip(action)) {
                    continue;
                }
                if ("sort_order".equals(action.field())) {
                    params.put("sort_order", systemEdge.sortOrder);
                    changed = true;
                } else if ("status".equals(action.field())) {
                    params.put("status", systemEdge.status == null ? null : systemEdge.status.name());
                    changed = true;
                }
            }
            if (changed) {
                gateway.write("catalog.sync.edge.update", params);
                applied++;
            } else {
                skipped++;
            }
        }

        // 4. relations
        Map<String, List<SyncAction>> relationActions = group(actions, RELATION);
        Set<String> tenantRelationKeys = new HashSet<>();
        for (CatalogTypeRelation relation : tenantRelations) {
            tenantRelationKeys.add(relationKey(cluster, relation));
        }
        for (Map.Entry<String, List<SyncAction>> entry : relationActions.entrySet()) {
            SyncAction action = entry.getValue().get(0);
            if (isSkip(action) || tenantRelationKeys.contains(entry.getKey())) {
                skipped++;
                continue;
            }
            CatalogTypeRelation systemRelation = systemRelations.stream()
                    .filter(relation -> entry.getKey().equals(relationKey(cluster, relation)))
                    .findFirst().orElse(null);
            CatalogType parent = systemRelation == null ? null : tenantBySystem(cluster).get(systemRelation.parentTypeId);
            CatalogType child = systemRelation == null ? null : tenantBySystem(cluster).get(systemRelation.childTypeId);
            if (parent == null || child == null) {
                skipped++;
                continue;
            }
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("parent_type_id", parent.id);
            params.put("child_type_id", child.id);
            params.put("relation_type", systemRelation.relationType.name());
            params.put("sort_order", systemRelation.sortOrder);
            params.put("status", systemRelation.status == null ? CatalogStatus.ACTIVE.name() : systemRelation.status.name());
            params.put("system_relation_id", systemRelation.id);
            params.put("created_at", Instant.now());
            params.put("updated_at", Instant.now());
            gateway.batch(List.of(new com.vn9melody.openerp.plugin.sdk.data.PluginDataClient.BatchStatement(
                    "catalog.type.relation.insert", params)));
            applied++;
        }

        cache.invalidate(tenantId);
        auditTrail.recordSuccess(tenantId, PlatformAction.CATALOG_TYPE_SYNC, "CATALOG_TYPE", cluster.root().id,
                Map.of(ResponseKey.CODE.getKey(), code, "applied", applied));
        return new SyncApplyResult(applied, skipped, conflicts(tenantId, code));
    }

    // ------------------------------------------------------------------
    // Conflict building
    // ------------------------------------------------------------------

    private List<SyncConflict> conflicts(UUID tenantId, String code) {
        Cluster cluster = load(tenantId, code);
        List<SyncConflict> conflicts = new ArrayList<>();
        Map<UUID, CatalogItem> systemItems = systemItems(cluster);
        Map<UUID, CatalogItem> tenantItems = tenantItems(cluster);
        Map<String, CatalogItem> tenantItemByKey = itemByKey(cluster, tenantItems.values());

        for (Map.Entry<UUID, CatalogType> entry : cluster.tenantBySystem().entrySet()) {
            CatalogType system = cluster.systemById().get(entry.getKey());
            CatalogType tenant = entry.getValue();
            if (system == null) {
                continue;
            }
            addTypeConflicts(conflicts, system, tenant);
            List<CatalogItem> systemTypeItems = systemItems.values().stream()
                    .filter(item -> item.typeId.equals(system.id)).toList();
            for (CatalogItem systemItem : systemTypeItems) {
                CatalogItem tenantItem = tenantItemByKey.get(itemKey(cluster, systemItem));
                if (tenantItem == null) {
                    conflicts.add(new SyncConflict(ITEM, itemKey(cluster, systemItem), null, null,
                            itemSummary(systemItem), SKIP));
                } else {
                    addItemConflicts(conflicts, cluster, systemItem, tenantItem);
                }
            }
        }

        Map<String, CatalogItemEdge> tenantEdgeByKey = edgeByKey(cluster, currentTenantEdges(cluster));
        Map<String, CatalogItemEdge> systemEdgeByKey = edgeByKey(cluster, currentSystemEdges(cluster));
        for (Map.Entry<String, CatalogItemEdge> entry : systemEdgeByKey.entrySet()) {
            String key = entry.getKey();
            CatalogItemEdge systemEdge = entry.getValue();
            CatalogItemEdge tenantEdge = tenantEdgeByKey.get(key);
            if (tenantEdge == null) {
                conflicts.add(new SyncConflict(EDGE, key, null, null, edgeSummary(cluster, systemEdge), SKIP));
            } else {
                if (tenantEdge.sortOrder != systemEdge.sortOrder) {
                    conflicts.add(new SyncConflict(EDGE, key, "sort_order", tenantEdge.sortOrder,
                            systemEdge.sortOrder, SKIP));
                }
                if (tenantEdge.status != systemEdge.status) {
                    conflicts.add(new SyncConflict(EDGE, key, "status",
                            tenantEdge.status == null ? null : tenantEdge.status.name(),
                            systemEdge.status == null ? null : systemEdge.status.name(), SKIP));
                }
            }
        }

        Set<String> tenantRelationKeys = new HashSet<>();
        for (CatalogTypeRelation relation : tenantRelations(cluster)) {
            tenantRelationKeys.add(relationKey(cluster, relation));
        }
        for (CatalogTypeRelation relation : systemRelations(cluster)) {
            String key = relationKey(cluster, relation);
            if (!tenantRelationKeys.contains(key)) {
                Map<String, Object> value = new LinkedHashMap<>();
                value.put("relation_type", relation.relationType.name());
                conflicts.add(new SyncConflict(RELATION, key, null, null, value, SKIP));
            }
        }
        return conflicts;
    }

    private void addTypeConflicts(List<SyncConflict> conflicts, CatalogType system, CatalogType tenant) {
        Map<String, Object> systemValues = typeFieldValues(system);
        Map<String, Object> tenantValues = typeFieldValues(tenant);
        for (Map.Entry<String, Object> entry : systemValues.entrySet()) {
            Object tenantValue = tenantValues.get(entry.getKey());
            if (!Objects.equals(tenantValue, entry.getValue())) {
                conflicts.add(new SyncConflict(TYPE, tenant.code, entry.getKey(), tenantValue,
                        entry.getValue(), SKIP));
            }
        }
    }

    private void addItemConflicts(List<SyncConflict> conflicts, Cluster cluster,
                                  CatalogItem system, CatalogItem tenant) {
        String key = itemKey(cluster, system);
        compare(conflicts, key, "name", tenant.name, system.name);
        compare(conflicts, key, "name_en", tenant.nameEn, system.nameEn);
        compare(conflicts, key, "description", tenant.description, system.description);
        compare(conflicts, key, "attributes", jsonValue(tenant.attributes), jsonValue(system.attributes));
        compare(conflicts, key, "sort_order", tenant.sortOrder, system.sortOrder);
        compare(conflicts, key, "status",
                tenant.status == null ? null : tenant.status.name(),
                system.status == null ? null : system.status.name());
    }

    private void compare(List<SyncConflict> conflicts, String key, String field, Object tenant, Object system) {
        if (!Objects.equals(tenant, system)) {
            conflicts.add(new SyncConflict(ITEM, key, field, tenant, system, SKIP));
        }
    }

    // ------------------------------------------------------------------
    // Apply helpers
    // ------------------------------------------------------------------

    private void applyTypeField(Map<String, Object> params, SyncAction action,
                                CatalogType tenant, CatalogType system) {
        String field = action.field();
        if (MERGE.equals(action.action()) && "attributes_schema".equals(field)) {
            params.put(field, mergeJson(tenant.attributesSchema, system.attributesSchema));
            return;
        }
        switch (field) {
            case "name_key" -> params.put(field, system.nameKey);
            case "description_key" -> params.put(field, system.descriptionKey);
            case "hierarchy_mode" -> params.put(field, system.hierarchyMode.name());
            case "allowed_relations" -> params.put(field,
                    system.allowedRelations == null ? null : List.of(system.allowedRelations));
            case "allowed_parent_types" -> params.put(field,
                    system.allowedParentTypes == null ? null : List.of(system.allowedParentTypes));
            case "max_depth" -> params.put(field, system.maxDepth);
            case "min_parents" -> params.put(field, system.minParents);
            case "allow_free_text" -> params.put(field, system.allowFreeText);
            case "versioned" -> params.put(field, system.versioned);
            case "effective_dated" -> params.put(field, system.effectiveDated);
            case "attributes_schema" -> params.put(field, system.attributesSchema);
            case "status" -> params.put(field, system.status.name());
            default -> { }
        }
        params.put("updated_at", Instant.now());
    }

    private boolean applyItemField(Map<String, Object> params, SyncAction action, CatalogItem system) {
        String field = action.field();
        if (MERGE.equals(action.action()) && "attributes".equals(field)) {
            params.put("attributes", mergeJson((JsonNode) params.get("attributes"), system.attributes));
            params.put("updated_at", Instant.now());
            return true;
        }
        switch (field) {
            case "name" -> params.put(field, system.name);
            case "name_en" -> params.put(field, system.nameEn);
            case "description" -> params.put(field, system.description);
            case "attributes" -> params.put(field, system.attributes);
            case "sort_order" -> params.put(field, system.sortOrder);
            case "status" -> params.put(field, system.status == null ? null : system.status.name());
            default -> {
                return false;
            }
        }
        params.put("updated_at", Instant.now());
        return true;
    }

    private JsonNode mergeJson(JsonNode tenant, JsonNode system) {
        if (tenant == null) {
            return system;
        }
        if (system == null) {
            return tenant;
        }
        if (tenant.isObject() && system.isObject()) {
            ObjectNode merged = ((ObjectNode) system).deepCopy();
            tenant.fields().forEachRemaining(entry -> merged.set(entry.getKey(), entry.getValue()));
            return merged;
        }
        return tenant;
    }

    private Map<String, Object> itemUpdateParams(CatalogItem item) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", item.id);
        params.put("name", item.name);
        params.put("name_en", item.nameEn);
        params.put("description", item.description);
        params.put("attributes", item.attributes);
        params.put("sort_order", item.sortOrder);
        params.put("status", item.status == null ? null : item.status.name());
        params.put("updated_at", Instant.now());
        return params;
    }

    private static boolean isSkip(SyncAction action) {
        return action.action() == null || SKIP.equalsIgnoreCase(action.action());
    }

    private static Map<String, List<SyncAction>> group(List<SyncAction> actions, String scope) {
        Map<String, List<SyncAction>> grouped = new LinkedHashMap<>();
        for (SyncAction action : actions) {
            if (scope.equals(action.scope()) && action.key() != null) {
                grouped.computeIfAbsent(action.key(), key -> new ArrayList<>()).add(action);
            }
        }
        return grouped;
    }

    // ------------------------------------------------------------------
    // Cluster loading / keys
    // ------------------------------------------------------------------

    private record Cluster(
            UUID tenantId,
            CatalogType root,
            Map<UUID, CatalogType> systemById,
            Map<UUID, CatalogType> tenantBySystem,
            Map<UUID, List<CatalogItem>> systemItemsByType,
            Map<UUID, List<CatalogItem>> tenantItemsByType,
            List<CatalogItemEdge> systemEdges,
            List<CatalogItemEdge> tenantEdges,
            List<CatalogTypeRelation> systemRelations,
            List<CatalogTypeRelation> tenantRelations
    ) {}

    private Cluster load(UUID tenantId, String code) {
        CatalogType root = guard.requireVisibleType(tenantId, code);
        if (!Objects.equals(root.tenantId, tenantId) || root.systemTypeId == null) {
            throw new ApiException(409, CatalogErrorCode.CATALOG_TYPE_NOT_CLONED,
                    "Catalog type is not a tenant clone");
        }
        Map<UUID, CatalogType> systemById = new HashMap<>();
        gateway.systemTypes().forEach(type -> systemById.put(type.id, type));
        List<CatalogTypeRelation> allRelations = gateway.allTypeRelations(tenantId);
        List<CatalogTypeRelation> systemRelations = allRelations.stream()
                .filter(relation -> relation.tenantId == null).toList();
        Set<UUID> component = CatalogCloneService.component(root.systemTypeId, systemRelations);
        Map<UUID, CatalogType> tenantBySystem = new HashMap<>();
        for (CatalogType type : gateway.visibleTypes(tenantId)) {
            if (Objects.equals(type.tenantId, tenantId)
                    && type.systemTypeId != null && component.contains(type.systemTypeId)) {
                tenantBySystem.put(type.systemTypeId, type);
            }
        }
        Map<UUID, List<CatalogItem>> systemItems = new HashMap<>();
        Map<UUID, List<CatalogItem>> tenantItems = new HashMap<>();
        for (Map.Entry<UUID, CatalogType> entry : tenantBySystem.entrySet()) {
            systemItems.put(entry.getKey(), gateway.cloneItems(tenantId, entry.getKey(), true).stream()
                    .filter(item -> item.tenantId == null && item.validTo == null).toList());
            tenantItems.put(entry.getKey(), gateway.cloneItems(tenantId, entry.getValue().id, false).stream()
                    .filter(item -> item.validTo == null).toList());
        }
        List<CatalogItemEdge> tenantEdges = gateway.cloneEdges(tenantId, false).stream()
                .filter(edge -> edge.validTo == null).toList();
        List<CatalogItemEdge> systemEdges = gateway.cloneEdges(tenantId, true).stream()
                .filter(edge -> edge.tenantId == null && edge.validTo == null).toList();
        List<CatalogTypeRelation> tenantRelations = allRelations.stream()
                .filter(relation -> Objects.equals(relation.tenantId, tenantId)).toList();
        return new Cluster(tenantId, root, systemById, tenantBySystem, systemItems, tenantItems,
                systemEdges, tenantEdges, systemRelations, tenantRelations);
    }

    private List<CatalogItemEdge> currentTenantEdges(Cluster cluster) {
        return cluster.tenantEdges();
    }

    private List<CatalogItemEdge> currentSystemEdges(Cluster cluster) {
        return cluster.systemEdges();
    }

    private List<CatalogTypeRelation> tenantRelations(Cluster cluster) {
        return cluster.tenantRelations();
    }

    private List<CatalogTypeRelation> systemRelations(Cluster cluster) {
        return cluster.systemRelations();
    }

    private Map<String, CatalogType> tenantByCode(Cluster cluster) {
        Map<String, CatalogType> byCode = new HashMap<>();
        cluster.tenantBySystem().values().forEach(type -> byCode.put(type.code, type));
        return byCode;
    }

    private Map<UUID, CatalogType> tenantBySystem(Cluster cluster) {
        return cluster.tenantBySystem();
    }

    private Map<UUID, CatalogItem> systemItems(Cluster cluster) {
        Map<UUID, CatalogItem> items = new HashMap<>();
        cluster.systemItemsByType().values().forEach(list -> list.forEach(item -> items.put(item.id, item)));
        return items;
    }

    private Map<UUID, CatalogItem> tenantItems(Cluster cluster) {
        Map<UUID, CatalogItem> items = new HashMap<>();
        cluster.tenantItemsByType().values().forEach(list -> list.forEach(item -> items.put(item.id, item)));
        return items;
    }

    private UUID tenantTypeId(Cluster cluster, UUID systemTypeId) {
        CatalogType type = cluster.tenantBySystem().get(systemTypeId);
        return type == null ? null : type.id;
    }

    private String itemKey(Cluster cluster, CatalogItem item) {
        CatalogType systemType = cluster.systemById().get(item.typeId);
        if (systemType != null) {
            return systemType.code + "/" + item.code;
        }
        for (Map.Entry<UUID, CatalogType> entry : cluster.tenantBySystem().entrySet()) {
            if (entry.getValue().id.equals(item.typeId)) {
                CatalogType system = cluster.systemById().get(entry.getKey());
                return (system == null ? entry.getValue().code : system.code) + "/" + item.code;
            }
        }
        return item.typeId + "/" + item.code;
    }

    private String relationKey(Cluster cluster, CatalogTypeRelation relation) {
        CatalogType parent = cluster.systemById().get(relation.parentTypeId);
        CatalogType child = cluster.systemById().get(relation.childTypeId);
        if (parent == null && relation.tenantId != null) {
            for (Map.Entry<UUID, CatalogType> entry : cluster.tenantBySystem().entrySet()) {
                if (entry.getValue().id.equals(relation.parentTypeId)) {
                    parent = cluster.systemById().get(entry.getKey());
                }
                if (entry.getValue().id.equals(relation.childTypeId)) {
                    child = cluster.systemById().get(entry.getKey());
                }
            }
        }
        return (parent == null ? String.valueOf(relation.parentTypeId) : parent.code) + ">"
                + (child == null ? String.valueOf(relation.childTypeId) : child.code)
                + "|" + relation.relationType;
    }

    private Map<String, CatalogItem> itemByKey(Cluster cluster, java.util.Collection<CatalogItem> items) {
        Map<String, CatalogItem> byKey = new HashMap<>();
        for (CatalogItem item : items) {
            byKey.put(itemKey(cluster, item), item);
        }
        return byKey;
    }

    private Map<String, CatalogItemEdge> edgeByKey(Cluster cluster, List<CatalogItemEdge> edges) {
        Map<String, CatalogItemEdge> byKey = new HashMap<>();
        Map<UUID, CatalogItem> items = new HashMap<>();
        systemItems(cluster).values().forEach(item -> items.put(item.id, item));
        tenantItems(cluster).values().forEach(item -> items.put(item.id, item));
        for (CatalogItemEdge edge : edges) {
            CatalogItem parent = items.get(edge.parentItemId);
            CatalogItem child = items.get(edge.childItemId);
            if (parent == null || child == null) {
                continue;
            }
            String key = itemKey(cluster, parent) + ">" + itemKey(cluster, child) + "|" + edge.relationType;
            byKey.put(key, edge);
        }
        return byKey;
    }

    private Map<String, Object> edgeSummary(Cluster cluster, CatalogItemEdge edge) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("relation_type", edge.relationType.name());
        return value;
    }

    private Map<String, Object> itemSummary(CatalogItem item) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("name", item.name);
        value.put("status", item.status == null ? null : item.status.name());
        return value;
    }

    private static Map<String, Object> typeFieldValues(CatalogType type) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("name_key", type.nameKey);
        values.put("description_key", type.descriptionKey);
        values.put("hierarchy_mode", type.hierarchyMode == null ? null : type.hierarchyMode.name());
        values.put("allowed_relations", type.allowedRelations == null ? null : List.of(type.allowedRelations));
        values.put("allowed_parent_types", type.allowedParentTypes == null ? null : List.of(type.allowedParentTypes));
        values.put("max_depth", type.maxDepth);
        values.put("min_parents", type.minParents);
        values.put("allow_free_text", type.allowFreeText);
        values.put("versioned", type.versioned);
        values.put("effective_dated", type.effectiveDated);
        values.put("attributes_schema", jsonValue(type.attributesSchema));
        values.put("status", type.status == null ? null : type.status.name());
        return values;
    }

    private static Object jsonValue(JsonNode node) {
        return node == null || node.isNull() ? null : node;
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
        params.put("updated_at", Instant.now());
        return params;
    }

    private static CatalogItem copyItem(CatalogItem source, UUID typeId) {
        CatalogItem item = new CatalogItem();
        item.typeId = typeId;
        item.systemItemId = source.id;
        item.versionGroupId = UUID.randomUUID();
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
}
