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
        List<Sort> sort,
        Map<String, String> values,
        List<String> returning,
        List<Join> joins,
        Page page,
        int maxRows,
        int timeoutMs) {

    public enum Mode { READ, WRITE }

    public enum Operation { LIST, GET, INSERT, UPDATE, DELETE }

    /** Tenant isolation applied by the compiler; metadata never comes from the payload. */
    public enum Scope { TENANT, TENANT_OR_SYSTEM, SYSTEM }

    public record Filter(String field, String op, String param, boolean required, boolean contains) {}

    /** Optional multi-column contains search (OR across the declared fields). */
    public record Search(String param, List<String> fields) {}

    public record Sort(String field, String direction) {}

    public record Join(String relation, List<String> select) {}

    public record Page(String pageParam, String sizeParam, int maxSize, int defaultSize) {}

    private static final Set<String> OPERATIONS = Set.of("LIST", "GET", "INSERT", "UPDATE", "DELETE");

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
        Map<String, String> values = new LinkedHashMap<>();
        JsonNode valuesNode = node.path("values");
        if (valuesNode.isObject()) {
            valuesNode.fields().forEachRemaining(entry ->
                    values.put(entry.getKey(), text(entry.getValue(), "param", entry.getKey())));
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
        return new PluginQueryDescriptor(id, mode, operation, entity, scope, select, filters, search, sort,
                values, returning, joins, page, maxRows, timeoutMs);
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
