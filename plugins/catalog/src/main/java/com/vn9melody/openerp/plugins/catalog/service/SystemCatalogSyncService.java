package com.vn9melody.openerp.plugins.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.cache.CatalogCache;
import com.vn9melody.openerp.plugins.catalog.gateway.CatalogGateway;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Exports and applies the system-catalog snapshot used by the core fan-out
 * (ADR-S05-001 A6.3). Snapshot keys are codes, never UUIDs, so the same payload
 * can be applied to every tenant schema while preserving local system ids and
 * tenant overrides that reference them.
 *
 * <p>Both sides run through the Plugin Data Gateway: the system plugin reads its
 * own schema, tenant plugins mirror rows with the {@code system_row} write
 * descriptors. No plugin holds a datasource.</p>
 */
@ApplicationScoped
public class SystemCatalogSyncService {

    private static final int CHUNK = 500;

    @Inject
    CatalogGateway gateway;

    @Inject
    CatalogCache cache;

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "plugin.scope", defaultValue = "tenant")
    String scope;

    @ConfigProperty(name = "plugin.tenant-id")
    java.util.Optional<String> tenantIdConfig;

    public JsonNode snapshot() {
        Instant now = Instant.now();
        ObjectNode root = objectMapper.createObjectNode();
        List<CatalogType> types = gateway.systemTypesFresh();

        Map<UUID, String> typeCodes = new HashMap<>();
        ArrayNode typesNode = root.putArray("types");
        for (CatalogType type : types) {
            typeCodes.put(type.id, type.code);
            ObjectNode node = typesNode.addObject();
            node.put("code", type.code);
            node.put("name_key", type.nameKey);
            node.put("description_key", type.descriptionKey);
            node.put("hierarchy_mode", type.hierarchyMode.name());
            node.set("allowed_relations", objectMapper.valueToTree(type.allowedRelations));
            node.set("allowed_parent_types", objectMapper.valueToTree(type.allowedParentTypes));
            if (type.maxDepth == null) {
                node.putNull("max_depth");
            } else {
                node.put("max_depth", type.maxDepth.intValue());
            }
            node.put("min_parents", type.minParents);
            node.put("allow_free_text", type.allowFreeText);
            node.put("versioned", type.versioned);
            node.put("effective_dated", type.effectiveDated);
            node.set("attributes_schema", type.attributesSchema);
            node.put("status", type.status.name());
        }

        Map<UUID, String[]> itemKeys = new HashMap<>();
        ArrayNode items = root.putArray("items");
        for (CatalogType type : types) {
            for (CatalogItem item : gateway.systemItemsByType(null, type.id, now)) {
                itemKeys.put(item.id, new String[] {type.code, item.code});
                ObjectNode node = items.addObject();
                node.put("type_code", type.code);
                node.put("code", item.code);
                node.put("name", item.name);
                node.put("name_en", item.nameEn);
                node.put("description", item.description);
                node.set("attributes", item.attributes);
                node.put("sort_order", item.sortOrder);
                node.put("status", item.status.name());
            }
        }

        ArrayNode edges = root.putArray("edges");
        for (CatalogItemEdge edge : gateway.systemEdgeIndex()) {
            String[] parent = itemKeys.get(edge.parentItemId);
            String[] child = itemKeys.get(edge.childItemId);
            if (parent == null || child == null) {
                continue;
            }
            ObjectNode node = edges.addObject();
            node.put("parent_type_code", parent[0]);
            node.put("parent_code", parent[1]);
            node.put("child_type_code", child[0]);
            node.put("child_code", child[1]);
            node.put("relation_type", edge.relationType.name());
            node.put("sort_order", edge.sortOrder);
            node.put("status", edge.status.name());
        }
        return root;
    }

    public JsonNode apply(JsonNode snapshot) {
        Instant now = Instant.now();
        int types = 0;
        int items = 0;
        int edges = 0;
        int skipped = 0;

        Map<String, CatalogType> typeByCode = new HashMap<>();
        for (CatalogType type : gateway.systemTypesFresh()) {
            typeByCode.put(type.code, type);
        }
        for (JsonNode node : snapshot.path("types")) {
            String code = textOrNull(node, "code");
            if (code == null) {
                skipped++;
                continue;
            }
            Map<String, Object> params = typeParams(node, now);
            CatalogType existing = typeByCode.get(code);
            if (existing == null) {
                existing = gateway.toType(gateway.write("catalog.type.insert.mirror", params).first());
                typeByCode.put(code, existing);
            } else {
                params.put("id", existing.id);
                gateway.write("catalog.type.update.mirror", params);
            }
            types++;
        }

        Map<String, CatalogItem> existingItems = new HashMap<>();
        Map<UUID, String> codeByTypeId = new HashMap<>();
        for (CatalogType type : typeByCode.values()) {
            codeByTypeId.put(type.id, type.code);
            for (CatalogItem item : gateway.systemItemsByType(null, type.id, now)) {
                existingItems.put(itemKey(type.code, item.code), item);
            }
        }

        List<PluginDataClient.BatchStatement> itemWrites = new ArrayList<>();
        for (JsonNode node : snapshot.path("items")) {
            String typeCode = textOrNull(node, "type_code");
            String code = textOrNull(node, "code");
            CatalogType type = typeCode == null ? null : typeByCode.get(typeCode);
            if (type == null || code == null) {
                skipped++;
                continue;
            }
            CatalogItem existing = existingItems.get(itemKey(typeCode, code));
            if (existing == null) {
                itemWrites.add(new PluginDataClient.BatchStatement("catalog.item.insert.mirror",
                        itemInsertParams(type.id, node, code, now)));
            } else if (itemChanged(existing, node, code)) {
                itemWrites.add(new PluginDataClient.BatchStatement("catalog.item.update.mirror",
                        itemUpdateParams(existing.id, node, code, now)));
            }
            items++;
        }
        runBatches(itemWrites);

        Map<String, CatalogItem> itemIds = new HashMap<>();
        for (CatalogItem item : gateway.systemItemIndex()) {
            String typeCode = codeByTypeId.get(item.typeId);
            if (typeCode != null) {
                itemIds.put(itemKey(typeCode, item.code), item);
            }
        }
        Map<String, CatalogItemEdge> existingEdges = new HashMap<>();
        for (CatalogItemEdge edge : gateway.systemEdgeIndex()) {
            existingEdges.put(edgeKey(edge.parentItemId, edge.childItemId, edge.relationType), edge);
        }

        List<PluginDataClient.BatchStatement> edgeWrites = new ArrayList<>();
        for (JsonNode node : snapshot.path("edges")) {
            CatalogItem parent = itemIds.get(itemKey(textOrNull(node, "parent_type_code"),
                    textOrNull(node, "parent_code")));
            CatalogItem child = itemIds.get(itemKey(textOrNull(node, "child_type_code"),
                    textOrNull(node, "child_code")));
            if (parent == null || child == null) {
                skipped++;
                continue;
            }
            CatalogRelationType relation = CatalogRelationType.fromString(
                    textOrNull(node, "relation_type"));
            CatalogItemEdge existing = existingEdges.get(edgeKey(parent.id, child.id, relation));
            int sortOrder = node.path("sort_order").asInt(0);
            String status = node.path("status").asText(CatalogStatus.ACTIVE.name());
            if (existing == null) {
                edgeWrites.add(new PluginDataClient.BatchStatement("catalog.edge.insert.mirror",
                        edgeParams(parent.id, child.id, relation, sortOrder, status, now)));
            } else if (existing.sortOrder != sortOrder
                    || !status.equals(existing.status == null ? null : existing.status.name())) {
                Map<String, Object> params = new LinkedHashMap<>();
                params.put("id", existing.id);
                params.put("sort_order", sortOrder);
                params.put("status", status);
                edgeWrites.add(new PluginDataClient.BatchStatement("catalog.edge.update.mirror", params));
            }
            edges++;
        }
        runBatches(edgeWrites);

        invalidateCache();
        ObjectNode result = objectMapper.createObjectNode();
        result.put("types", types);
        result.put("items", items);
        result.put("edges", edges);
        result.put("skipped", skipped);
        return result;
    }

    private void runBatches(List<PluginDataClient.BatchStatement> statements) {
        for (int start = 0; start < statements.size(); start += CHUNK) {
            int end = Math.min(statements.size(), start + CHUNK);
            gateway.batch(statements.subList(start, end));
        }
    }

    private Map<String, Object> typeParams(JsonNode node, Instant now) {
        String code = node.path("code").asText();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("code", code);
        params.put("name_key", node.path("name_key").asText("CATALOG_TYPE_" + code));
        params.put("description_key", textOrNull(node, "description_key"));
        params.put("hierarchy_mode", node.path("hierarchy_mode").asText(null));
        params.put("allowed_relations", array(node.path("allowed_relations"), "HIERARCHY"));
        params.put("allowed_parent_types", node.path("allowed_parent_types").isArray()
                ? array(node.path("allowed_parent_types"), null) : null);
        params.put("max_depth", node.path("max_depth").isNumber() ? node.path("max_depth").asInt() : null);
        params.put("min_parents", node.path("min_parents").asInt(0));
        params.put("allow_free_text", node.path("allow_free_text").asBoolean(false));
        params.put("versioned", node.path("versioned").asBoolean(true));
        params.put("effective_dated", node.path("effective_dated").asBoolean(true));
        params.put("attributes_schema", node.hasNonNull("attributes_schema")
                ? node.get("attributes_schema") : null);
        params.put("status", node.path("status").asText(CatalogStatus.ACTIVE.name()));
        params.put("updated_at", now);
        return params;
    }

    private static Map<String, Object> itemInsertParams(UUID typeId, JsonNode node, String code, Instant now) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("type_id", typeId);
        params.put("version_group_id", UUID.randomUUID());
        params.put("version", 1);
        params.put("code", code);
        params.put("name", node.path("name").asText(code));
        params.put("name_en", textOrNull(node, "name_en"));
        params.put("description", textOrNull(node, "description"));
        params.put("attributes", node.hasNonNull("attributes") ? node.get("attributes") : null);
        params.put("sort_order", node.path("sort_order").asInt(0));
        params.put("status", node.path("status").asText(CatalogStatus.ACTIVE.name()));
        params.put("valid_from", now);
        params.put("created_at", now);
        params.put("updated_at", now);
        return params;
    }

    private static Map<String, Object> itemUpdateParams(UUID id, JsonNode node, String code, Instant now) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", id);
        params.put("name", node.path("name").asText(code));
        params.put("name_en", textOrNull(node, "name_en"));
        params.put("description", textOrNull(node, "description"));
        params.put("attributes", node.hasNonNull("attributes") ? node.get("attributes") : null);
        params.put("sort_order", node.path("sort_order").asInt(0));
        params.put("status", node.path("status").asText(CatalogStatus.ACTIVE.name()));
        params.put("updated_at", now);
        return params;
    }

    private static Map<String, Object> edgeParams(UUID parentId, UUID childId, CatalogRelationType relation,
                                                  int sortOrder, String status, Instant now) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("parent_item_id", parentId);
        params.put("child_item_id", childId);
        params.put("relation_type", relation.name());
        params.put("sort_order", sortOrder);
        params.put("status", status);
        params.put("valid_from", now);
        params.put("created_at", now);
        return params;
    }

    private static boolean itemChanged(CatalogItem item, JsonNode node, String code) {
        String status = item.status == null ? CatalogStatus.ACTIVE.name() : item.status.name();
        return !Objects.equals(item.name, node.path("name").asText(code))
                || !Objects.equals(item.nameEn, textOrNull(node, "name_en"))
                || !Objects.equals(item.description, textOrNull(node, "description"))
                || !Objects.equals(item.attributes, node.hasNonNull("attributes") ? node.get("attributes") : null)
                || item.sortOrder != node.path("sort_order").asInt(0)
                || !status.equals(node.path("status").asText(CatalogStatus.ACTIVE.name()));
    }

    private void invalidateCache() {
        UUID tenantId = tenantIdConfig.map(UUID::fromString).orElse(null);
        cache.invalidate(tenantId);
        if ("platform".equalsIgnoreCase(scope)) {
            cache.invalidate(null);
        }
    }

    private static String itemKey(String typeCode, String code) {
        return typeCode + "\u0000" + code;
    }

    private static String edgeKey(UUID parentId, UUID childId, CatalogRelationType relation) {
        return parentId + "|" + childId + "|" + relation.name();
    }

    private static String[] array(JsonNode node, String fallback) {
        if (!node.isArray() || node.isEmpty()) {
            return fallback == null ? null : new String[] {fallback};
        }
        String[] values = new String[node.size()];
        for (int i = 0; i < node.size(); i++) {
            values[i] = node.get(i).asText();
        }
        return values;
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
