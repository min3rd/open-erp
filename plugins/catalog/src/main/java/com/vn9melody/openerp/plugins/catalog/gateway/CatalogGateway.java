package com.vn9melody.openerp.plugins.catalog.gateway;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.catalog.api.CatalogHierarchyMode;
import com.vn9melody.openerp.plugins.catalog.api.CatalogRelationType;
import com.vn9melody.openerp.plugins.catalog.api.CatalogStatus;
import com.vn9melody.openerp.plugins.catalog.cache.CatalogCache;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItem;
import com.vn9melody.openerp.plugins.catalog.model.CatalogItemEdge;
import com.vn9melody.openerp.plugins.catalog.model.CatalogType;
import com.vn9melody.openerp.plugins.catalog.model.CatalogTypeGrant;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Read/write side of the catalog on top of the core Plugin Data Gateway. All
 * reads are cached in the catalog's own Redis namespace; the plugin owns no
 * datasource, entity manager or repository.
 */
@ApplicationScoped
public class CatalogGateway {

    public record Page<T>(List<T> items, long total) {
        public Page {
            items = items == null ? List.of() : List.copyOf(items);
        }
    }

    @Inject
    PluginDataClient client;

    @Inject
    CatalogCache cache;

    @Inject
    ObjectMapper objectMapper;

    // ------------------------------------------------------------------
    // Types
    // ------------------------------------------------------------------

    public List<CatalogType> visibleTypes(UUID tenantId) {
        return cache.getOrLoad(tenantId, "types:visible",
                new TypeReference<List<CatalogType>>() {}, () -> query("catalog.types.visible", Map.of())
                        .rows().stream().map(this::toType).toList());
    }

    public List<CatalogType> systemTypes() {
        return cache.getOrLoad(null, "types:system",
                new TypeReference<List<CatalogType>>() {}, () -> query("catalog.types.system", Map.of())
                        .rows().stream().map(this::toType).toList());
    }

    /** Uncached system types for startup seeding and snapshot export. */
    public List<CatalogType> systemTypesFresh() {
        return query("catalog.types.system", Map.of()).rows().stream().map(this::toType).toList();
    }

    public CatalogType systemTypeByCode(String code) {
        return systemTypesFresh().stream()
                .filter(type -> code.equals(type.code))
                .findFirst()
                .orElse(null);
    }

    /** Current system items of one type, paged to stay under the gRPC message limit. */
    public List<CatalogItem> systemItemsByType(UUID tenantId, UUID typeId, Instant asOf) {
        return pageThrough("catalog.items.system.by.type",
                Map.of("type_id", typeId, "as_of", asOf), 2000, this::toItem);
    }

    /** Lightweight index of current system items ({@code id,type_id,code}). */
    public List<CatalogItem> systemItemIndex() {
        return pageThrough("catalog.items.system.index", Map.of(), 2000, this::toItem);
    }

    /** Lightweight index of current system edges (no timestamps). */
    public List<CatalogItemEdge> systemEdgeIndex() {
        return pageThrough("catalog.edges.system.index", Map.of(), 2000, this::toEdge);
    }

    private <T> List<T> pageThrough(String queryId, Map<String, ?> base, int size,
                                    java.util.function.Function<Map<String, Object>, T> mapper) {
        List<T> all = new ArrayList<>();
        int page = 0;
        while (true) {
            Map<String, Object> params = new java.util.LinkedHashMap<>(base);
            params.put("page", page);
            params.put("size", size);
            List<Map<String, Object>> rows = query(queryId, params).rows();
            rows.forEach(row -> all.add(mapper.apply(row)));
            if (rows.size() < size) {
                return all;
            }
            page++;
        }
    }

    /** System type id for a code, used for override badges under tenant type overrides. */
    public UUID systemTypeId(String code) {
        return systemTypes().stream()
                .filter(type -> code.equals(type.code))
                .map(type -> type.id)
                .findFirst()
                .orElse(null);
    }

    public CatalogType visibleTypeByCode(UUID tenantId, String code) {
        return cache.getOrLoad(tenantId, "types:code:" + CatalogCache.hash(code),
                new TypeReference<CatalogType>() {},
                () -> {
                    List<CatalogType> rows = query("catalog.types.by.code", Map.of("code", code))
                            .rows().stream().map(this::toType).toList();
                    return rows.stream().filter(row -> row.tenantId != null).findFirst()
                            .orElse(rows.isEmpty() ? null : rows.get(0));
                });
    }

    public CatalogType typeById(UUID tenantId, UUID id) {
        return cache.getOrLoad(tenantId, "types:id:" + id,
                new TypeReference<CatalogType>() {},
                () -> row(query("catalog.types.by.id", Map.of("id", id))));
    }

    /** Exact owner row (tenant or system), used by write duplicate checks. */
    public CatalogType typeByCodeExact(UUID tenantId, String code) {
        return visibleTypes(tenantId).stream()
                .filter(type -> Objects.equals(type.tenantId, tenantId) && code.equals(type.code))
                .findFirst()
                .orElse(null);
    }

    public CatalogType insertType(UUID tenantId, Map<String, ?> params, boolean system) {
        String queryId = system ? "catalog.type.insert.system" : "catalog.type.insert";
        return toType(write(queryId, params).first());
    }

    public CatalogType updateType(UUID tenantId, Map<String, ?> params, boolean system) {
        String queryId = system ? "catalog.type.update.system" : "catalog.type.update";
        return toType(write(queryId, params).first());
    }

    public List<CatalogType> typesByIds(UUID tenantId, Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        Set<UUID> wanted = new HashSet<>(ids);
        return visibleTypes(tenantId).stream().filter(type -> wanted.contains(type.id)).toList();
    }

    // ------------------------------------------------------------------
    // Items
    // ------------------------------------------------------------------

    public CatalogItem itemById(UUID tenantId, UUID id) {
        return cache.getOrLoad(tenantId, "items:id:" + id,
                new TypeReference<CatalogItem>() {},
                () -> itemRow(query("catalog.items.by.id", Map.of("id", id))));
    }

    public List<CatalogItem> itemsByIds(UUID tenantId, Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<UUID> sorted = ids.stream().distinct().sorted().toList();
        return cache.getOrLoad(tenantId, "items:ids:" + CatalogCache.hash(sorted),
                new TypeReference<List<CatalogItem>>() {},
                () -> query("catalog.items.by.ids", Map.of("ids", sorted)).rows().stream()
                        .map(this::toItem).toList());
    }

    public List<CatalogItem> itemVersions(UUID tenantId, UUID versionGroupId) {
        return cache.getOrLoad(tenantId, "items:versions:" + versionGroupId,
                new TypeReference<List<CatalogItem>>() {},
                () -> query("catalog.items.by.version.group",
                        Map.of("version_group_id", versionGroupId)).rows().stream()
                        .map(this::toItem).toList());
    }

    public List<CatalogItem> descendants(UUID tenantId, UUID rootId, Instant asOf, int maxDepth) {
        return cache.getOrLoad(tenantId, "items:descendants:" + CatalogCache.hash(rootId, cacheInstant(asOf), maxDepth),
                new TypeReference<List<CatalogItem>>() {},
                () -> query("catalog.items.descendants", Map.of(
                                "root_id", rootId,
                                "as_of", asOf,
                                "max_depth", maxDepth))
                        .rows().stream().map(this::toItem).toList());
    }

    public CatalogItem currentItemByCode(UUID tenantId, UUID typeId, String code, boolean system) {
        String queryId = system ? "catalog.item.current.by.code.system" : "catalog.item.current.by.code";
        List<Map<String, Object>> rows = query(queryId, Map.of("type_id", typeId, "code", code)).rows();
        return rows.isEmpty() ? null : toItem(rows.get(0));
    }

    public CatalogItem visibleCurrentByCodeOrName(UUID tenantId, UUID typeId, String code, String name) {
        List<Map<String, Object>> byCode = query("catalog.item.visible.current.by.code",
                Map.of("type_id", typeId, "code", code)).rows();
        if (!byCode.isEmpty()) {
            return toItem(byCode.get(0));
        }
        List<Map<String, Object>> byName = query("catalog.item.visible.current.by.name",
                Map.of("type_id", typeId, "name", name)).rows();
        return byName.isEmpty() ? null : toItem(byName.get(0));
    }

    public CatalogItem insertItem(UUID tenantId, Map<String, ?> params, boolean system) {
        String queryId = system ? "catalog.item.insert.system" : "catalog.item.insert";
        return toItem(write(queryId, params).first());
    }

    public CatalogItem insertItem(UUID tenantId, CatalogItem item, boolean system) {
        return insertItem(tenantId, itemParams(item), system);
    }

    public CatalogItem updateItemVersioned(UUID tenantId, CatalogItem current, CatalogItem next,
                                           Instant now, UUID actor) {
        boolean system = current.tenantId == null;
        Map<String, Object> close = new java.util.LinkedHashMap<>();
        close.put("id", current.id);
        close.put("valid_to", now);
        close.put("updated_at", now);
        close.put("updated_by", actor);
        List<PluginDataClient.BatchStatement> statements = new ArrayList<>();
        statements.add(new PluginDataClient.BatchStatement(
                system ? "catalog.item.close.system" : "catalog.item.close", close));
        statements.add(new PluginDataClient.BatchStatement(
                system ? "catalog.item.insert.system" : "catalog.item.insert", itemParams(next)));
        List<PluginQueryResult> results = client.executeBatch(statements);
        return toItem(results.get(1).first());
    }

    public CatalogItem closeItem(UUID tenantId, UUID itemId, Instant validTo, UUID actor, boolean system) {
        Map<String, Object> params = new java.util.LinkedHashMap<>();
        params.put("id", itemId);
        params.put("valid_to", validTo);
        params.put("updated_at", validTo);
        params.put("updated_by", actor);
        return toItem(write(system ? "catalog.item.close.system" : "catalog.item.close", params).first());
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

    public List<CatalogItem> exportItems(UUID tenantId, UUID typeId, Instant asOf, String q, String status,
                                         UUID parentId, String relationType) {
        Map<String, Object> params = new java.util.LinkedHashMap<>();
        params.put("type_id", typeId);
        params.put("as_of", asOf);
        params.put("page", 0);
        params.put("size", 20000);
        putIfPresent(params, "q", q);
        putIfPresent(params, "status", status);
        if (parentId != null) {
            params.put("parent_id", parentId);
        }
        putIfPresent(params, "relation_type", relationType);
        return query("catalog.items.export", params).rows().stream().map(this::toItem).toList();
    }

    public List<CatalogItemEdge> exportEdgesByChildren(UUID tenantId, Collection<UUID> childIds, Instant asOf) {
        if (childIds == null || childIds.isEmpty()) {
            return List.of();
        }
        List<UUID> sorted = childIds.stream().distinct().sorted().toList();
        return query("catalog.edges.by.children.export", Map.of(
                        "child_item_ids", sorted,
                        "status", CatalogStatus.ACTIVE.name(),
                        "as_of", asOf,
                        "page", 0,
                        "size", 20000))
                .rows().stream().map(this::toEdge).toList();
    }

    public List<CatalogItem> exportItemsByIds(UUID tenantId, Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<UUID> sorted = ids.stream().distinct().sorted().toList();
        return query("catalog.items.by.ids.export", Map.of(
                        "ids", sorted,
                        "page", 0,
                        "size", 20000))
                .rows().stream().map(this::toItem).toList();
    }

    public Page<CatalogItem> adminPage(UUID tenantId, UUID typeId, Instant asOf, String q, String status,
                                       UUID parentId, String relationType, int page, int size) {        Map<String, Object> params = new java.util.LinkedHashMap<>();
        params.put("type_id", typeId);
        params.put("as_of", asOf);
        params.put("page", page);
        params.put("size", size);
        putIfPresent(params, "q", q);
        putIfPresent(params, "status", status);
        if (parentId != null) {
            params.put("parent_id", parentId);
        }
        putIfPresent(params, "relation_type", relationType);
        String key = "items:admin:" + CatalogCache.hash(typeId, cacheInstant(asOf), q, status, parentId, relationType, page, size);
        return cache.getOrLoad(tenantId, key, new TypeReference<Page<CatalogItem>>() {},
                () -> pageResult(query("catalog.items.admin", params), this::toItem));
    }

    public Page<CatalogItem> mergedOptions(UUID tenantId, UUID typeId, Instant asOf, String q,
                                           UUID parentId, int page, int size) {
        Map<String, Object> params = new java.util.LinkedHashMap<>();
        params.put("type_id", typeId);
        params.put("as_of", asOf);
        params.put("page", page);
        params.put("size", size);
        putIfPresent(params, "q", q);
        if (parentId != null) {
            params.put("parent_id", parentId);
        }
        String key = "items:merged:" + CatalogCache.hash(typeId, cacheInstant(asOf), q, parentId, page, size);
        return cache.getOrLoad(tenantId, key, new TypeReference<Page<CatalogItem>>() {},
                () -> pageResult(query("catalog.items.merged.options", params), this::toItem));
    }

    public Set<String> systemCodes(UUID tenantId, UUID typeId, Instant asOf, Collection<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return Set.of();
        }
        List<String> sorted = codes.stream().distinct().sorted().toList();
        String key = "items:system-codes:" + CatalogCache.hash(typeId, cacheInstant(asOf), sorted);
        List<String> found = cache.getOrLoad(tenantId, key, new TypeReference<List<String>>() {},
                () -> query("catalog.items.system.codes", Map.of(
                                "type_id", typeId,
                                "codes", sorted,
                                "as_of", asOf,
                                "status", CatalogStatus.ACTIVE.name()))
                        .rows().stream().map(row -> text(row, "code")).filter(value -> value != null).toList());
        return new HashSet<>(found);
    }

    // ------------------------------------------------------------------
    // Edges
    // ------------------------------------------------------------------

    public List<CatalogItemEdge> edgesByChild(UUID tenantId, UUID childId, Instant asOf) {
        return edgesByChildren(tenantId, List.of(childId), asOf);
    }

    public List<CatalogItemEdge> edgesByChildFresh(UUID tenantId, UUID childId, Instant asOf) {
        return query("catalog.edges.by.child", Map.of(
                        "child_item_id", childId,
                        "status", CatalogStatus.ACTIVE.name(),
                        "as_of", asOf))
                .rows().stream().map(this::toEdge).toList();
    }

    public List<CatalogItemEdge> edgesByChildren(UUID tenantId, Collection<UUID> childIds, Instant asOf) {
        if (childIds == null || childIds.isEmpty()) {
            return List.of();
        }
        List<UUID> sorted = childIds.stream().distinct().sorted().toList();
        return cache.getOrLoad(tenantId, "edges:children:" + CatalogCache.hash(sorted, cacheInstant(asOf)),
                new TypeReference<List<CatalogItemEdge>>() {},
                () -> query("catalog.edges.by.children", Map.of(
                                "child_item_ids", sorted,
                                "status", CatalogStatus.ACTIVE.name(),
                                "as_of", asOf))
                        .rows().stream().map(this::toEdge).toList());
    }

    public List<CatalogItemEdge> edgesByParent(UUID tenantId, UUID parentId, Instant asOf) {
        return cache.getOrLoad(tenantId, "edges:parent:" + CatalogCache.hash(parentId, cacheInstant(asOf)),
                new TypeReference<List<CatalogItemEdge>>() {},
                () -> query("catalog.edges.by.parent", Map.of(
                                "parent_item_id", parentId,
                                "status", CatalogStatus.ACTIVE.name(),
                                "as_of", asOf))
                        .rows().stream().map(this::toEdge).toList());
    }

    public CatalogItemEdge edgeById(UUID tenantId, UUID edgeId, boolean system) {
        String queryId = system ? "catalog.edge.by.id.system" : "catalog.edge.by.id";
        List<Map<String, Object>> rows = query(queryId, Map.of("id", edgeId)).rows();
        return rows.isEmpty() ? null : toEdge(rows.get(0));
    }

    public CatalogItemEdge activeEdge(UUID tenantId, UUID parentId, UUID childId,
                                      String relationType, boolean system) {
        String queryId = system ? "catalog.edge.active.system" : "catalog.edge.active";
        List<Map<String, Object>> rows = query(queryId, Map.of(
                "parent_item_id", parentId,
                "child_item_id", childId,
                "relation_type", relationType)).rows();
        return rows.isEmpty() ? null : toEdge(rows.get(0));
    }

    public List<CatalogItemEdge> currentEdgesByChild(UUID tenantId, UUID childId) {
        return query("catalog.edges.current.by.child", Map.of(
                        "child_item_id", childId,
                        "status", CatalogStatus.ACTIVE.name()))
                .rows().stream().map(this::toEdge).toList();
    }

    public PluginQueryResult write(String queryId, Map<String, ?> params) {
        return client.write(queryId, params);
    }

    public CatalogItemEdge insertEdge(UUID tenantId, Map<String, ?> params, boolean system) {
        String queryId = system ? "catalog.edge.insert.system" : "catalog.edge.insert";
        return toEdge(write(queryId, params).first());
    }

    public CatalogItemEdge insertEdge(UUID tenantId, CatalogItemEdge edge, boolean system) {
        Map<String, Object> params = new java.util.LinkedHashMap<>();
        params.put("parent_item_id", edge.parentItemId);
        params.put("child_item_id", edge.childItemId);
        params.put("relation_type", edge.relationType == null ? null : edge.relationType.name());
        params.put("sort_order", edge.sortOrder);
        params.put("status", edge.status == null ? null : edge.status.name());
        params.put("valid_from", edge.validFrom);
        params.put("created_by", edge.createdBy);
        params.put("created_at", edge.createdAt);
        return insertEdge(tenantId, params, system);
    }

    public CatalogItemEdge closeEdge(UUID tenantId, UUID edgeId, Instant validTo, boolean system) {
        String queryId = system ? "catalog.edge.close.system" : "catalog.edge.close";
        return toEdge(write(queryId, Map.of("id", edgeId, "valid_to", validTo)).first());
    }

    public boolean wouldCreateCycle(UUID tenantId, UUID parentId, UUID childId) {
        if (parentId.equals(childId)) {
            return true;
        }
        java.util.Set<UUID> visited = new java.util.HashSet<>();
        java.util.ArrayDeque<UUID> pending = new java.util.ArrayDeque<>();
        pending.add(parentId);
        int depth = 0;
        while (!pending.isEmpty() && depth++ < 1000) {
            UUID current = pending.poll();
            if (!visited.add(current)) {
                continue;
            }
            for (CatalogItemEdge edge : edgesByChildFresh(tenantId, current, Instant.now())) {
                if (childId.equals(edge.parentItemId)) {
                    return true;
                }
                if (!visited.contains(edge.parentItemId)) {
                    pending.add(edge.parentItemId);
                }
            }
        }
        return false;
    }

    public List<UUID> parentIdsWithChildren(UUID tenantId, Collection<UUID> parentIds, Instant asOf) {
        if (parentIds == null || parentIds.isEmpty()) {
            return List.of();
        }
        List<UUID> sorted = parentIds.stream().distinct().sorted().toList();
        return cache.getOrLoad(tenantId, "edges:parents:" + CatalogCache.hash(sorted, cacheInstant(asOf)),
                new TypeReference<List<UUID>>() {},
                () -> query("catalog.edges.parents.with.children", Map.of(
                                "parent_item_ids", sorted,
                                "status", CatalogStatus.ACTIVE.name(),
                                "as_of", asOf))
                        .rows().stream()
                        .map(row -> uuid(row, "parent_item_id"))
                        .filter(value -> value != null)
                        .distinct()
                        .toList());
    }

    // ------------------------------------------------------------------
    // Grants
    // ------------------------------------------------------------------

    public List<CatalogTypeGrant> grantsByType(UUID tenantId, UUID typeId) {
        return cache.getOrLoad(tenantId, "grants:type:" + typeId,
                new TypeReference<List<CatalogTypeGrant>>() {},
                () -> query("catalog.grants.by.type", Map.of("type_id", typeId)).rows().stream()
                        .map(this::toGrant).toList());
    }

    public CatalogTypeGrant grantById(UUID tenantId, UUID id) {
        return cache.getOrLoad(tenantId, "grants:id:" + id,
                new TypeReference<CatalogTypeGrant>() {},
                () -> grantRow(query("catalog.grants.by.id", Map.of("id", id))));
    }

    public CatalogTypeGrant grantByRole(UUID tenantId, UUID typeId, String roleCode) {
        return cache.getOrLoad(tenantId, "grants:role:" + CatalogCache.hash(typeId, roleCode),
                new TypeReference<CatalogTypeGrant>() {},
                () -> grantRow(query("catalog.grants.by.role",
                        Map.of("type_id", typeId, "role_code", roleCode))));
    }

    public void deleteGrantsByType(UUID tenantId, UUID typeId) {
        client.write("catalog.grant.delete.by.type", Map.of("type_id", typeId));
    }

    public List<CatalogTypeGrant> replaceGrants(UUID tenantId, UUID typeId,
                                                List<Map<String, Object>> grants) {
        List<PluginDataClient.BatchStatement> statements = new ArrayList<>();
        statements.add(new PluginDataClient.BatchStatement("catalog.grant.delete.by.type",
                Map.of("type_id", typeId)));
        for (Map<String, Object> grant : grants) {
            statements.add(new PluginDataClient.BatchStatement("catalog.grant.insert", grant));
        }
        List<PluginQueryResult> results = client.executeBatch(statements);
        return results.subList(1, results.size()).stream()
                .map(result -> toGrant(result.first()))
                .toList();
    }

    public List<PluginQueryResult> batch(List<PluginDataClient.BatchStatement> statements) {
        return client.executeBatch(statements);
    }

    // ------------------------------------------------------------------
    // Mapping
    // ------------------------------------------------------------------

    private PluginQueryResult query(String queryId, Map<String, ?> params) {
        return client.query(queryId, params);
    }

    private <T> Page<T> pageResult(PluginQueryResult result, java.util.function.Function<Map<String, Object>, T> mapper) {
        return new Page<>(result.rows().stream().map(mapper).toList(), result.totalRows());
    }

    private CatalogType row(PluginQueryResult result) {
        return result.rows().isEmpty() ? null : toType(result.rows().get(0));
    }

    private CatalogItem itemRow(PluginQueryResult result) {
        return result.rows().isEmpty() ? null : toItem(result.rows().get(0));
    }

    private CatalogTypeGrant grantRow(PluginQueryResult result) {
        return result.rows().isEmpty() ? null : toGrant(result.rows().get(0));
    }

    public CatalogType toType(Map<String, Object> row) {
        CatalogType type = new CatalogType();
        type.id = uuid(row, "id");
        type.tenantId = uuid(row, "tenant_id");
        type.code = text(row, "code");
        type.nameKey = text(row, "name_key");
        type.descriptionKey = text(row, "description_key");
        type.hierarchyMode = enumValue(CatalogHierarchyMode.class, text(row, "hierarchy_mode"),
                CatalogHierarchyMode.TREE);
        type.allowedRelations = stringArray(row.get("allowed_relations"), new String[] {"HIERARCHY"});
        type.allowedParentTypes = stringArray(row.get("allowed_parent_types"), null);
        type.maxDepth = shortValue(row, "max_depth");
        type.minParents = shortValue(row, "min_parents") == null ? 0 : shortValue(row, "min_parents");
        type.allowFreeText = bool(row, "allow_free_text");
        type.versioned = bool(row, "versioned");
        type.effectiveDated = bool(row, "effective_dated");
        type.attributesSchema = json(row.get("attributes_schema"));
        type.status = enumValue(CatalogStatus.class, text(row, "status"), CatalogStatus.ACTIVE);
        type.createdAt = instant(row, "created_at");
        type.updatedAt = instant(row, "updated_at");
        return type;
    }

    private CatalogItem toItem(Map<String, Object> row) {
        CatalogItem item = new CatalogItem();
        item.id = uuid(row, "id");
        item.tenantId = uuid(row, "tenant_id");
        item.typeId = uuid(row, "type_id");
        item.versionGroupId = uuid(row, "version_group_id");
        item.version = intValue(row, "version");
        item.code = text(row, "code");
        item.name = text(row, "name");
        item.nameEn = text(row, "name_en");
        item.description = text(row, "description");
        item.attributes = json(row.get("attributes"));
        item.sortOrder = intValue(row, "sort_order");
        item.status = enumValue(CatalogStatus.class, text(row, "status"), CatalogStatus.ACTIVE);
        item.validFrom = instant(row, "valid_from");
        item.validTo = instant(row, "valid_to");
        item.supersedesItemId = uuid(row, "supersedes_item_id");
        item.createdBy = uuid(row, "created_by");
        item.createdAt = instant(row, "created_at");
        item.updatedBy = uuid(row, "updated_by");
        item.updatedAt = instant(row, "updated_at");
        return item;
    }

    private CatalogItemEdge toEdge(Map<String, Object> row) {
        CatalogItemEdge edge = new CatalogItemEdge();
        edge.id = uuid(row, "id");
        edge.tenantId = uuid(row, "tenant_id");
        edge.parentItemId = uuid(row, "parent_item_id");
        edge.childItemId = uuid(row, "child_item_id");
        edge.relationType = enumValue(CatalogRelationType.class, text(row, "relation_type"),
                CatalogRelationType.HIERARCHY);
        edge.sortOrder = intValue(row, "sort_order");
        edge.status = enumValue(CatalogStatus.class, text(row, "status"), CatalogStatus.ACTIVE);
        edge.validFrom = instant(row, "valid_from");
        edge.validTo = instant(row, "valid_to");
        edge.createdBy = uuid(row, "created_by");
        edge.createdAt = instant(row, "created_at");
        return edge;
    }

    private CatalogTypeGrant toGrant(Map<String, Object> row) {
        CatalogTypeGrant grant = new CatalogTypeGrant();
        grant.id = uuid(row, "id");
        grant.tenantId = uuid(row, "tenant_id");
        grant.typeId = uuid(row, "type_id");
        grant.roleCode = text(row, "role_code");
        grant.canRead = bool(row, "can_read");
        grant.canWrite = bool(row, "can_write");
        grant.createdAt = instant(row, "created_at");
        grant.updatedAt = instant(row, "updated_at");
        return grant;
    }

    private static void putIfPresent(Map<String, Object> params, String key, String value) {
        if (value != null && !value.isBlank()) {
            params.put(key, value);
        }
    }

    private static Instant cacheInstant(Instant asOf) {
        return asOf == null ? null : asOf.truncatedTo(ChronoUnit.MINUTES);
    }

    private static UUID uuid(Map<String, Object> row, String key) {
        String value = text(row, key);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String text(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private static boolean bool(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value instanceof Boolean bool ? bool : Boolean.parseBoolean(String.valueOf(value));
    }

    private static int intValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value instanceof Number number ? number.intValue()
                : value == null ? 0 : Integer.parseInt(String.valueOf(value));
    }

    private static Short shortValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) {
            return null;
        }
        return value instanceof Number number ? number.shortValue() : Short.parseShort(String.valueOf(value));
    }

    private static Instant instant(Map<String, Object> row, String key) {
        String value = text(row, key);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(value).toInstant();
            } catch (DateTimeParseException ignoredAgain) {
                return null;
            }
        }
    }

    private JsonNode json(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof JsonNode node) {
            return node;
        }
        try {
            return objectMapper.readTree(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }

    private static String[] stringArray(Object value, String[] defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toArray(String[]::new);
        }
        if (value instanceof String[] array) {
            return array;
        }
        String text = String.valueOf(value).trim();
        if (text.startsWith("{") && text.endsWith("}")) {
            text = text.substring(1, text.length() - 1);
        }
        if (text.isBlank()) {
            return new String[0];
        }
        return Arrays.stream(text.split(",")).map(String::trim).filter(item -> !item.isEmpty())
                .toArray(String[]::new);
    }

    private static <E extends Enum<E>> E enumValue(Class<E> type, String value, E defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return Enum.valueOf(type, value);
        } catch (IllegalArgumentException e) {
            return defaultValue;
        }
    }
}
