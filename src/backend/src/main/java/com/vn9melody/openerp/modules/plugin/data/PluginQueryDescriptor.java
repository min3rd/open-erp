package com.vn9melody.openerp.modules.plugin.data;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Declarative query descriptor owned by a plugin (SOL-S05-002 section 6). The
 * plugin never sends SQL: core compiles this descriptor into a parameterized
 * statement.
 */
public record PluginQueryDescriptor(
        String id,
        Mode mode,
        Operation operation,
        String entity,
        Scope scope,
        List<String> select,
        List<Filter> filters,
        List<Search> search,
        List<Exists> exists,
        List<PostFilter> postFilters,
        String mergeKey,
        Tree tree,
        List<Sort> sort,
        Map<String, ValueSpec> values,
        List<String> returning,
        List<Join> joins,
        Page page,
        boolean distinct,
        boolean bulk,
        int maxRows,
        int timeoutMs) {

    public enum Mode { READ, WRITE }

    public enum Operation { LIST, GET, INSERT, UPDATE, DELETE, MERGED_LIST, TREE }

    /** Tenant isolation applied by the compiler; metadata never comes from the payload. */
    public enum Scope { TENANT, TENANT_OR_SYSTEM, SYSTEM }

    /** One write value: source param, optionality and SQL cast (jsonb/array). */
    public record ValueSpec(String param, boolean optional, boolean allowNull, String type) {}

    public record Filter(String field, String op, String param, boolean required, boolean contains) {}

    /** Optional multi-column contains search (OR across the declared fields). */
    public record Search(String param, List<String> fields) {}

    /** Correlated EXISTS filter (parent/relation guard) with an optional validity range. */
    public record Exists(String entity, String localField, String remoteField,
                         String filterField, String param, String effectiveParam,
                         String status, Scope tenantScope) {}

    /** Filter applied after tenant/system merge, e.g. hide rows whose tenant override is INACTIVE. */
    public record PostFilter(String field, String op, String value) {}

    /** Recursive descendants through a declared edge entity. */
    public record Tree(String edgeEntity, String rootParam, String parentField, String childField,
                       String effectiveParam, String depthParam, int defaultDepth, int maxDepth,
                       String status) {}

    public record Sort(String field, String direction) {}

    public record Join(String relation, List<String> select) {}

    public record Page(String pageParam, String sizeParam, int maxSize, int defaultSize) {}

    private static final Set<String> OPERATIONS = Set.of("LIST", "GET", "INSERT", "UPDATE", "DELETE",
            "MERGED_LIST", "TREE");

    public static PluginQueryDescriptor parse(JsonNode node) {
        String id = text(node, "id", null);
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Query descriptor is missing id");
        }
        Mode mode = Mode.valueOf(text(node, "mode", "READ").toUpperCase(Locale.ROOT));
        Operation operation = Operation.valueOf(text(node, "operation", "LIST").toUpperCase(Locale.ROOT));
        if (!OPERATIONS.contains(operation.name())) {
            throw new IllegalArgumentException("Unsupported operation " + operation);
        }
        String entity = text(node, "entity", null);
        if (entity == null || entity.isBlank()) {
            throw new IllegalArgumentException("Query " + id + " is missing entity");
        }
        Scope scope = Scope.valueOf(text(node, "tenant_scope", "TENANT").toUpperCase(Locale.ROOT));
        List<String> select = strings(node.path("select"));
        List<Filter> filters = new ArrayList<>();
        for (JsonNode filter : node.path("filters")) {
            String field = text(filter, "field", null);
            if (field == null || field.isBlank()) {
                throw new IllegalArgumentException("Query " + id + " has a filter without field");
            }
            String op = text(filter, "op", "EQ").toUpperCase(Locale.ROOT);
            String param = text(filter, "param", field);
            filters.add(new Filter(field, op, param,
                    filter.path("required").asBoolean(false),
                    "CONTAINS".equalsIgnoreCase(text(filter, "match", "EXACT"))));
        }
        List<Sort> sort = new ArrayList<>();
        for (JsonNode item : node.path("sort")) {
            String field = text(item, "field", null);
            if (field != null && !field.isBlank()) {
                sort.add(new Sort(field, text(item, "direction", "ASC").toUpperCase(Locale.ROOT)));
            }
        }
        List<Search> search = new ArrayList<>();
        for (JsonNode item : node.path("search")) {
            String param = text(item, "param", null);
            List<String> fields = strings(item.path("fields"));
            if (param != null && !param.isBlank() && !fields.isEmpty()) {
                search.add(new Search(param, fields));
            }
        }
        List<Exists> exists = new ArrayList<>();
        for (JsonNode item : node.path("exists")) {
            String target = text(item, "entity", null);
            String localField = text(item, "local_field", null);
            String remoteField = text(item, "remote_field", null);
            String filterField = text(item, "filter_field", null);
            String param = text(item, "param", null);
            if (target == null || localField == null || remoteField == null
                    || filterField == null || param == null) {
                throw new IllegalArgumentException("Query " + id + " has an incomplete exists filter");
            }
            exists.add(new Exists(target, localField, remoteField, filterField, param,
                    text(item, "effective_param", null),
                    text(item, "status", null),
                    Scope.valueOf(text(item, "tenant_scope", "TENANT_OR_SYSTEM")
                            .toUpperCase(Locale.ROOT))));
        }
        List<PostFilter> postFilters = new ArrayList<>();
        for (JsonNode item : node.path("post_filters")) {
            String field = text(item, "field", null);
            String op = text(item, "op", "EQ").toUpperCase(Locale.ROOT);
            String value = text(item, "value", null);
            if (field != null && value != null) {
                postFilters.add(new PostFilter(field, op, value));
            }
        }
        String mergeKey = text(node, "merge_key", null);
        Tree tree = null;
        JsonNode treeNode = node.path("tree");
        if (treeNode.isObject()) {
            tree = new Tree(
                    text(treeNode, "edge_entity", null),
                    text(treeNode, "root_param", "root_id"),
                    text(treeNode, "parent_field", "parent_item_id"),
                    text(treeNode, "child_field", "child_item_id"),
                    text(treeNode, "effective_param", null),
                    text(treeNode, "depth_param", "max_depth"),
                    treeNode.path("default_depth").asInt(100),
                    treeNode.path("max_depth").asInt(1000),
                    text(treeNode, "status", null));
        }
        Map<String, ValueSpec> values = new LinkedHashMap<>();
        JsonNode valuesNode = node.path("values");
        if (valuesNode.isObject()) {
            valuesNode.fields().forEachRemaining(entry -> {
                JsonNode spec = entry.getValue();
                if (spec.isTextual()) {
                    values.put(entry.getKey(), new ValueSpec(spec.asText(), false, false, null));
                } else {
                    values.put(entry.getKey(), new ValueSpec(
                            text(spec, "param", entry.getKey()),
                            spec.path("optional").asBoolean(false),
                            spec.path("allow_null").asBoolean(false),
                            text(spec, "type", null)));
                }
            });
        }
        List<String> returning = strings(node.path("returning"));
        List<Join> joins = new ArrayList<>();
        for (JsonNode join : node.path("joins")) {
            String relation = text(join, "relation", null);
            if (relation != null && !relation.isBlank()) {
                joins.add(new Join(relation, strings(join.path("select"))));
            }
        }
        JsonNode pageNode = node.path("page");
        Page page = pageNode.isObject()
                ? new Page(text(pageNode, "pageParam", "page"),
                        text(pageNode, "sizeParam", "size"),
                        pageNode.path("maxSize").asInt(100),
                        pageNode.path("defaultSize").asInt(20))
                : null;
        int maxRows = node.path("maxRows").asInt(0);
        int timeoutMs = node.path("timeoutMs").asInt(0);
        boolean distinct = node.path("distinct").asBoolean(false);
        boolean bulk = node.path("bulk").asBoolean(false);
        return new PluginQueryDescriptor(id, mode, operation, entity, scope, select, filters, search,
                exists, postFilters, mergeKey, tree, sort, values, returning, joins, page, distinct, bulk,
                maxRows, timeoutMs);
    }

    private static String text(JsonNode node, String field, String defaultValue) {
        JsonNode value = node.path(field);
        return value.isTextual() ? value.asText() : defaultValue;
    }

    private static List<String> strings(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        node.forEach(item -> {
            if (item.isTextual() && !item.asText().isBlank()) {
                values.add(item.asText());
            }
        });
        return List.copyOf(values);
    }
}
