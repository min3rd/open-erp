package com.vn9melody.openerp.plugins.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogHierarchyMode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogItemEdgeRepository;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogItemRepository;
import com.vn9melody.openerp.plugins.catalog.repository.CatalogTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Exports and applies the system-catalog snapshot used by the core fan-out
 * (ADR-S05-001 A6.3). Snapshot keys are codes, never UUIDs, so the same payload
 * can be applied to every tenant schema while preserving local system ids and
 * tenant overrides that reference them.
 */
@ApplicationScoped
public class SystemCatalogSyncService {

    @Inject
    CatalogTypeRepository typeRepository;

    @Inject
    CatalogItemRepository itemRepository;

    @Inject
    CatalogItemEdgeRepository edgeRepository;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public JsonNode snapshot() {
        ObjectNode root = objectMapper.createObjectNode();
        Map<UUID, String> typeCodes = new HashMap<>();
        ArrayNode types = root.putArray("types");
        for (CatalogType type : typeRepository.list("tenantId is null order by code asc")) {
            typeCodes.put(type.id, type.code);
            ObjectNode node = types.addObject();
            node.put("code", type.code);
            node.put("name_key", type.nameKey);
            node.put("description_key", type.descriptionKey);
            node.put("hierarchy_mode", type.hierarchyMode.name());
            node.set("allowed_relations", objectMapper.valueToTree(type.allowedRelations));
            node.set("allowed_parent_types", objectMapper.valueToTree(type.allowedParentTypes));
            node.put("max_depth", type.maxDepth);
            node.put("min_parents", type.minParents);
            node.put("allow_free_text", type.allowFreeText);
            node.put("versioned", type.versioned);
            node.put("effective_dated", type.effectiveDated);
            node.set("attributes_schema", type.attributesSchema);
            node.put("status", type.status.name());
        }

        Map<UUID, String[]> itemKeys = new HashMap<>();
        ArrayNode items = root.putArray("items");
        for (CatalogItem item : itemRepository.list("tenantId is null and validTo is null order by code asc")) {
            String typeCode = typeCodes.get(item.typeId);
            if (typeCode == null) {
                continue;
            }
            itemKeys.put(item.id, new String[]{typeCode, item.code});
            ObjectNode node = items.addObject();
            node.put("type_code", typeCode);
            node.put("code", item.code);
            node.put("name", item.name);
            node.put("name_en", item.nameEn);
            node.put("description", item.description);
            node.set("attributes", item.attributes);
            node.put("sort_order", item.sortOrder);
            node.put("status", item.status.name());
        }

        ArrayNode edges = root.putArray("edges");
        for (CatalogItemEdge edge : edgeRepository.list("tenantId is null and validTo is null order by createdAt asc")) {
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

    @Transactional
    public JsonNode apply(JsonNode snapshot) {
        int types = 0;
        int items = 0;
        int edges = 0;
        int skipped = 0;
        Map<String, CatalogType> typeByCode = new HashMap<>();
        for (JsonNode node : snapshot.path("types")) {
            CatalogType type = upsertType(node);
            typeByCode.put(type.code, type);
            types++;
        }

        Map<String, CatalogItem> itemByKey = new HashMap<>();
        for (JsonNode node : snapshot.path("items")) {
            String typeCode = node.path("type_code").asText(null);
            String code = node.path("code").asText(null);
            CatalogType type = typeByCode.get(typeCode);
            if (type == null || code == null) {
                skipped++;
                continue;
            }
            CatalogItem item = upsertItem(type, node);
            itemByKey.put(typeCode + "\u0000" + code, item);
            items++;
        }

        for (JsonNode node : snapshot.path("edges")) {
            String parentType = node.path("parent_type_code").asText(null);
            String parentCode = node.path("parent_code").asText(null);
            String childType = node.path("child_type_code").asText(null);
            String childCode = node.path("child_code").asText(null);
            CatalogItem parent = itemByKey.get(parentType + "\u0000" + parentCode);
            CatalogItem child = itemByKey.get(childType + "\u0000" + childCode);
            if (parent == null || child == null) {
                skipped++;
                continue;
            }
            upsertEdge(parent, child, node);
            edges++;
        }

        ObjectNode result = objectMapper.createObjectNode();
        result.put("types", types);
        result.put("items", items);
        result.put("edges", edges);
        result.put("skipped", skipped);
        return result;
    }

    private CatalogType upsertType(JsonNode node) {
        String code = node.path("code").asText();
        CatalogType type = typeRepository.findSystemByCode(code);
        if (type == null) {
            type = new CatalogType();
            type.tenantId = null;
            type.code = code;
            type.createdAt = Instant.now();
        }
        type.nameKey = node.path("name_key").asText("CATALOG_TYPE_" + code);
        type.descriptionKey = textOrNull(node, "description_key");
        type.hierarchyMode = CatalogHierarchyMode.fromString(node.path("hierarchy_mode").asText(null));
        type.allowedRelations = array(node.path("allowed_relations"), "HIERARCHY");
        type.allowedParentTypes = node.path("allowed_parent_types").isArray()
            ? array(node.path("allowed_parent_types"), null) : null;
        type.maxDepth = node.path("max_depth").isNumber() ? (short) node.path("max_depth").asInt() : null;
        type.minParents = (short) node.path("min_parents").asInt(0);
        type.allowFreeText = node.path("allow_free_text").asBoolean(false);
        type.versioned = node.path("versioned").asBoolean(true);
        type.effectiveDated = node.path("effective_dated").asBoolean(true);
        type.attributesSchema = node.hasNonNull("attributes_schema") ? node.get("attributes_schema") : null;
        type.status = CatalogStatus.fromString(node.path("status").asText(null));
        type.updatedAt = Instant.now();
        if (type.id == null) {
            typeRepository.persist(type);
        }
        return type;
    }

    private CatalogItem upsertItem(CatalogType type, JsonNode node) {
        String code = node.path("code").asText();
        CatalogItem item = itemRepository.findCurrentByCode(null, type.id, code);
        if (item == null) {
            item = new CatalogItem();
            item.tenantId = null;
            item.typeId = type.id;
            item.versionGroupId = UUID.randomUUID();
            item.version = 1;
            item.code = code;
            item.validFrom = Instant.now();
            item.createdAt = Instant.now();
        }
        item.name = node.path("name").asText(code);
        item.nameEn = textOrNull(node, "name_en");
        item.description = textOrNull(node, "description");
        item.attributes = node.hasNonNull("attributes") ? node.get("attributes") : null;
        item.sortOrder = node.path("sort_order").asInt(0);
        item.status = CatalogStatus.fromString(node.path("status").asText(null));
        item.updatedAt = Instant.now();
        if (item.id == null) {
            itemRepository.persist(item);
        }
        return item;
    }

    private void upsertEdge(CatalogItem parent, CatalogItem child, JsonNode node) {
        CatalogRelationType relation = CatalogRelationType.fromString(node.path("relation_type").asText(null));
        CatalogItemEdge edge = edgeRepository.find(
                "tenantId is null and parentItemId = ?1 and childItemId = ?2 and relationType = ?3 and validTo is null",
                parent.id, child.id, relation).firstResult();
        if (edge == null) {
            edge = new CatalogItemEdge();
            edge.tenantId = null;
            edge.parentItemId = parent.id;
            edge.childItemId = child.id;
            edge.relationType = relation;
            edge.validFrom = Instant.now();
            edge.createdAt = Instant.now();
        }
        edge.sortOrder = node.path("sort_order").asInt(0);
        edge.status = CatalogStatus.fromString(node.path("status").asText(null));
        if (edge.id == null) {
            edgeRepository.persist(edge);
        }
    }

    private String[] array(JsonNode node, String fallback) {
        if (!node.isArray() || node.isEmpty()) {
            return fallback == null ? null : new String[]{fallback};
        }
        String[] values = new String[node.size()];
        for (int i = 0; i < node.size(); i++) {
            values[i] = node.get(i).asText();
        }
        return values;
    }

    private String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
