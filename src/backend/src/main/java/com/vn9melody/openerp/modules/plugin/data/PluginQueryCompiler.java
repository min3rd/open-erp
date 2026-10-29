package com.vn9melody.openerp.modules.plugin.data;

import com.google.protobuf.ListValue;
import com.google.protobuf.Value;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Compiles a declarative query descriptor into a parameterized PostgreSQL
 * statement. Table, column, relation and operator names come from the
 * validated manifest, never from the request payload.
 */
@ApplicationScoped
public final class PluginQueryCompiler {

    private static final Set<String> FILTER_OPS = Set.of(
            "EQ", "NE", "GT", "GTE", "LT", "LTE", "IN", "ILIKE", "LIKE",
            "BETWEEN", "IS_NULL", "IS_NOT_NULL", "EFFECTIVE_AT", "LOWER_EQ");

    public record CompiledQuery(String sql, List<Object> params,
                                String countSql, List<Object> countParams) {}

    public CompiledQuery compile(PluginManifest manifest, PluginQueryDescriptor query,
                                 Map<String, Value> params, String schema,
                                 PluginQueryDescriptor.Scope scope) {
        return switch (query.operation()) {
            case LIST -> list(manifest, query, params, schema, scope);
            case GET -> get(manifest, query, params, schema, scope);
            case INSERT -> insert(manifest, query, params, schema, scope);
            case UPDATE -> update(manifest, query, params, schema, scope);
            case DELETE -> delete(manifest, query, params, schema, scope);
            case MERGED_LIST -> mergedList(manifest, query, params, schema, scope);
            case TREE -> tree(manifest, query, params, schema, scope);
        };
    }

    private CompiledQuery tree(PluginManifest manifest, PluginQueryDescriptor query,
                               Map<String, Value> params, String schema,
                               PluginQueryDescriptor.Scope scope) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        PluginQueryDescriptor.Tree tree = query.tree();
        if (tree == null || tree.edgeEntity() == null) {
            throw invalid(query, "TREE requires an edge_entity");
        }
        PluginManifest.Entity edge = manifest.entities().get(tree.edgeEntity());
        if (edge == null) {
            throw invalid(query, "unknown tree edge entity " + tree.edgeEntity());
        }
        Value root = params.get(tree.rootParam());
        if (root == null || root.hasNullValue()) {
            throw missing(query, tree.rootParam());
        }
        Integer depth = intParamValue(params, tree.depthParam());
        int maxDepth = Math.min(tree.maxDepth() <= 0 ? 1000 : tree.maxDepth(),
                depth == null ? tree.defaultDepth() : depth);
        maxDepth = Math.max(1, maxDepth);

        List<Object> values = new ArrayList<>();
        values.add(toJava(root));
        String valid = "";
        Object asOf = null;
        if (tree.effectiveParam() != null) {
            Value asOfValue = params.get(tree.effectiveParam());
            if (asOfValue == null || asOfValue.hasNullValue()) {
                throw missing(query, tree.effectiveParam());
            }
            asOf = toJava(asOfValue);
            values.add(asOf);
            values.add(asOf);
            valid = " AND e." + quote("valid_from") + " <= ?"
                    + " AND (e." + quote("valid_to") + " IS NULL OR e." + quote("valid_to") + " > ?)";
        }
        if (asOf == null) {
            throw invalid(query, "TREE requires effective_param");
        }
        String status = tree.status() == null ? ""
                : " AND e." + quote("status") + " = " + literal(tree.status());
        String tenant = scope == PluginQueryDescriptor.Scope.SYSTEM
                ? "" : " AND " + tenantPredicate("e", scope);

        String inner = "SELECT e." + quote(tree.childField()) + " AS id, 1 AS depth"
                + " FROM " + qualified(schema, edge.table()) + " e"
                + " WHERE e." + quote(tree.parentField()) + " = ?" + valid + status + tenant;
        String recursive = " UNION ALL SELECT e." + quote(tree.childField()) + ", s.depth + 1"
                + " FROM " + qualified(schema, edge.table()) + " e"
                + " JOIN subtree s ON e." + quote(tree.parentField()) + " = s.id"
                + " WHERE e." + quote("valid_from") + " <= ?"
                + " AND (e." + quote("valid_to") + " IS NULL OR e." + quote("valid_to") + " > ?)"
                + status + tenant + " AND s.depth < ?";
        values.add(asOf);
        values.add(asOf);
        values.add(maxDepth);

        String outerTenant = scope == PluginQueryDescriptor.Scope.SYSTEM
                ? "" : " WHERE " + tenantPredicate("t", scope);
        String sql = "WITH RECURSIVE subtree AS (" + inner + recursive + ")"
                + " SELECT " + selectList(entity, query)
                + " FROM " + qualified(schema, entity.table()) + " t"
                + " JOIN subtree s ON s.id = t." + quote(primaryKey(entity))
                + outerTenant + " ORDER BY t." + quote(primaryKey(entity)) + " ASC";
        return new CompiledQuery(sql, values, null, List.of());
    }

    private CompiledQuery mergedList(PluginManifest manifest, PluginQueryDescriptor query,
                                     Map<String, Value> params, String schema,
                                     PluginQueryDescriptor.Scope scope) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        String mergeKey = query.mergeKey();
        if (mergeKey == null || mergeKey.isBlank() || !entity.fields().contains(mergeKey)) {
            throw invalid(query, "MERGED_LIST requires a public merge_key");
        }
        if (!entity.fields().contains("tenant_id")) {
            throw invalid(query, "MERGED_LIST requires a tenant-scoped entity");
        }
        if (!query.joins().isEmpty()) {
            throw invalid(query, "MERGED_LIST does not support joins");
        }
        PluginQueryDescriptor.Scope mergeScope = scope == PluginQueryDescriptor.Scope.SYSTEM
                ? PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM
                : scope;
        Source source = source(manifest, query, entity, schema, mergeScope, params, false);
        String innerWhere = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);
        String inner = "SELECT DISTINCT ON (t." + quote(mergeKey) + ") t.*"
                + source.from + innerWhere
                + " ORDER BY t." + quote(mergeKey) + " ASC,"
                + " (t." + quote("tenant_id") + " IS NULL) ASC";

        List<String> post = new ArrayList<>();
        List<Object> postParams = new ArrayList<>();
        for (PluginQueryDescriptor.PostFilter filter : query.postFilters()) {
            post.add(postPredicate("merged", entity, query, filter));
        }
        for (PluginQueryDescriptor.Exists exists : query.exists()) {
            String predicate = existsPredicate("merged", manifest, query, exists, params, postParams, schema);
            if (predicate != null) {
                post.add(predicate);
            }
        }
        String outerWhere = post.isEmpty() ? "" : " WHERE " + String.join(" AND ", post);

        PageSlice slice = pageSlice(query, params);
        List<Object> sqlParams = new ArrayList<>(source.params);
        sqlParams.addAll(postParams);
        sqlParams.add(slice.size());
        sqlParams.add(slice.offset());
        String order = dynamicOrder(entity, query, "merged", params);
        if (order == null) {
            order = "merged." + quote(mergeKey) + " ASC";
        }
        String sql = "SELECT " + plainSelectList("merged", entity, query)
                + " FROM (" + inner + ") merged" + outerWhere
                + " ORDER BY " + order + " LIMIT ? OFFSET ?";

        List<Object> countParams = new ArrayList<>(source.params);
        countParams.addAll(postParams);
        String countSql = "SELECT count(*) AS \"total\" FROM (" + inner + ") merged" + outerWhere;
        return new CompiledQuery(sql, sqlParams, countSql, countParams);
    }

    private CompiledQuery list(PluginManifest manifest, PluginQueryDescriptor query,
                               Map<String, Value> params, String schema,
                               PluginQueryDescriptor.Scope scope) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        Source source = source(manifest, query, entity, schema, scope, params, true);
        String where = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);

        List<Object> sqlParams = new ArrayList<>(source.params);
        String select = selectList(entity, query);
        StringBuilder sql = new StringBuilder(query.distinct() ? "SELECT DISTINCT " : "SELECT ")
                .append(select).append(source.from).append(where);

        String dynamicOrder = dynamicOrder(entity, query, "t", params);
        if (dynamicOrder != null) {
            sql.append(" ORDER BY ").append(dynamicOrder);
        } else if (!query.sort().isEmpty()) {
            List<String> order = new ArrayList<>();
            for (PluginQueryDescriptor.Sort sort : query.sort()) {
                requireField(entity, query, sort.field());
                order.add("t." + quote(sort.field()) + " " + direction(sort.direction()));
            }
            sql.append(" ORDER BY ").append(String.join(", ", order));
        } else if (!query.distinct()) {
            sql.append(" ORDER BY t.").append(quote(primaryKey(entity))).append(" ASC");
        }

        PageSlice slice = pageSlice(query, params);
        sql.append(" LIMIT ? OFFSET ?");
        sqlParams.add(slice.size());
        sqlParams.add(slice.offset());

        String countSql = query.distinct()
                ? "SELECT count(*) AS \"total\" FROM (SELECT DISTINCT " + select
                        + source.from + where + ") d"
                : "SELECT count(*) AS \"total\"" + source.from + where;
        return new CompiledQuery(sql.toString(), sqlParams, countSql, new ArrayList<>(source.params));
    }

    private CompiledQuery get(PluginManifest manifest, PluginQueryDescriptor query,
                              Map<String, Value> params, String schema,
                              PluginQueryDescriptor.Scope scope) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        Source source = source(manifest, query, entity, schema, scope, params, true);
        String where = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);
        String sql = "SELECT " + selectList(entity, query) + source.from + where + " LIMIT 1";
        return new CompiledQuery(sql, new ArrayList<>(source.params), null, List.of());
    }

    private CompiledQuery insert(PluginManifest manifest, PluginQueryDescriptor query,
                                 Map<String, Value> params, String schema,
                                 PluginQueryDescriptor.Scope scope) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        if (scope == PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM) {
            throw invalid(query, "write descriptor cannot use TENANT_OR_SYSTEM");
        }
        if (query.values().isEmpty()) {
            throw invalid(query, "INSERT descriptor has no values");
        }
        if (query.values().containsKey("tenant_id")) {
            throw invalid(query, "tenant_id is managed by the gateway");
        }
        // Dedicated per-tenant schemas may not carry a tenant_id column; the
        // schema itself is the isolation boundary. Only add the managed column
        // when the entity actually declares it.
        List<String> columns = new ArrayList<>();
        List<String> placeholders = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, PluginQueryDescriptor.ValueSpec> entry : query.values().entrySet()) {
            requireField(entity, query, entry.getKey());
            WriteValue bound = writeValue(query, entry.getValue(), params);
            if (bound.skip()) {
                continue;
            }
            columns.add(quote(entry.getKey()));
            placeholders.add(bound.placeholder());
            values.add(bound.value());
        }
        if (columns.isEmpty()) {
            throw invalid(query, "INSERT descriptor has no bound values");
        }
        if (entity.fields().contains("tenant_id")) {
            columns.add(quote("tenant_id"));
            placeholders.add(scope == PluginQueryDescriptor.Scope.TENANT && !query.systemRow()
                    ? "current_setting('app.tenant_id')::uuid"
                    : "NULL");
        }
        List<String> returning = returning(entity, query);
        String sql = "INSERT INTO " + qualified(schema, entity.table())
                + " (" + String.join(", ", columns) + ")"
                + " VALUES (" + String.join(", ", placeholders) + ")"
                + " RETURNING " + String.join(", ", returning);
        return new CompiledQuery(sql, values, null, List.of());
    }

    private CompiledQuery update(PluginManifest manifest, PluginQueryDescriptor query,
                                 Map<String, Value> params, String schema,
                                 PluginQueryDescriptor.Scope scope) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        if (scope == PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM) {
            throw invalid(query, "write descriptor cannot use TENANT_OR_SYSTEM");
        }
        if (query.values().isEmpty()) {
            throw invalid(query, "UPDATE descriptor has no values");
        }
        if (query.values().containsKey("tenant_id")) {
            throw invalid(query, "tenant_id is managed by the gateway");
        }
        if (query.filters().isEmpty()) {
            throw invalid(query, "UPDATE descriptor must declare a filter");
        }
        Source source = source(manifest, query, entity, schema, scope, params, true);
        List<String> assignments = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, PluginQueryDescriptor.ValueSpec> entry : query.values().entrySet()) {
            requireField(entity, query, entry.getKey());
            WriteValue bound = writeValue(query, entry.getValue(), params);
            if (bound.skip()) {
                continue;
            }
            assignments.add(quote(entry.getKey()) + " = " + bound.placeholder());
            values.add(bound.value());
        }
        if (assignments.isEmpty()) {
            throw invalid(query, "UPDATE descriptor has no bound values");
        }
        values.addAll(source.params);
        String where = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);
        String sql = "UPDATE " + qualified(schema, entity.table()) + " t"
                + " SET " + String.join(", ", assignments) + where
                + " RETURNING " + String.join(", ", returning(entity, query));
        return new CompiledQuery(sql, values, null, List.of());
    }

    private CompiledQuery delete(PluginManifest manifest, PluginQueryDescriptor query,
                                 Map<String, Value> params, String schema,
                                 PluginQueryDescriptor.Scope scope) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        if (query.filters().isEmpty()) {
            throw invalid(query, "DELETE descriptor must declare a filter");
        }
        Source source = source(manifest, query, entity, schema, scope, params, true);
        String where = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);
        String sql = "DELETE FROM " + qualified(schema, entity.table()) + " t" + where
                + " RETURNING " + String.join(", ", returning(entity, query));
        return new CompiledQuery(sql, new ArrayList<>(source.params), null, List.of());
    }

    private record Source(String from, List<String> where, List<Object> params) {}

    private record PageSlice(int size, int offset) {}

    private record WriteValue(String placeholder, Object value, boolean skip) {
        static WriteValue skipped() {
            return new WriteValue(null, null, true);
        }
    }

    /** Parameter that must be bound with a PostgreSQL array type. */
    public record ArrayValue(String sqlType, List<?> values) {}

    private WriteValue writeValue(PluginQueryDescriptor query, PluginQueryDescriptor.ValueSpec spec,
                                  Map<String, Value> params) {
        Value value = params.get(spec.param());
        if (value == null || value.getKindCase() == Value.KindCase.KIND_NOT_SET) {
            if (spec.optional()) {
                return WriteValue.skipped();
            }
            throw missing(query, spec.param());
        }
        if (value.hasNullValue()) {
            if (spec.allowNull()) {
                return new WriteValue(placeholder(spec), null, false);
            }
            if (spec.optional()) {
                return WriteValue.skipped();
            }
            throw missing(query, spec.param());
        }
        Object bound = toJava(value);
        String type = spec.type();
        if (type != null && type.endsWith("[]")) {
            String elementType = type.substring(0, type.length() - 2);
            List<?> items = bound instanceof List<?> list ? list : List.of(bound);
            return new WriteValue(placeholder(spec), new ArrayValue(elementType, items), false);
        }
        return new WriteValue(placeholder(spec), bound, false);
    }

    private static String placeholder(PluginQueryDescriptor.ValueSpec spec) {
        if (spec.type() == null || spec.type().isBlank()) {
            return "?";
        }
        return "CAST(? AS " + spec.type() + ")";
    }

    /** Optional request-driven sort, restricted to the descriptor allowlist. */
    private String dynamicOrder(PluginManifest.Entity entity, PluginQueryDescriptor query,
                                String alias, Map<String, Value> params) {
        if (query.sortParam() == null || query.sortParam().isBlank()) {
            return null;
        }
        Value fieldValue = params.get(query.sortParam());
        if (fieldValue == null || !fieldValue.hasStringValue() || fieldValue.getStringValue().isBlank()) {
            return null;
        }
        String field = fieldValue.getStringValue().trim();
        if (!query.sortFields().contains(field)) {
            throw invalid(query, "sort field is not allowed: " + field);
        }
        requireField(entity, query, field);
        String direction = "ASC";
        if (query.directionParam() != null) {
            Value directionValue = params.get(query.directionParam());
            if (directionValue != null && directionValue.hasStringValue()
                    && "desc".equalsIgnoreCase(directionValue.getStringValue().trim())) {
                direction = "DESC";
            }
        }
        return alias + "." + quote(field) + " " + direction
                + ", " + alias + "." + quote(primaryKey(entity)) + " ASC";
    }

    private PageSlice pageSlice(PluginQueryDescriptor query, Map<String, Value> params) {
        PluginQueryDescriptor.Page page = query.page();
        int defaultSize = page != null ? page.defaultSize() : 20;
        int maxSize = query.maxRows() > 0 ? query.maxRows() : (page != null ? page.maxSize() : 100);
        int size = page != null ? intParam(params, page.sizeParam(), defaultSize) : defaultSize;
        size = Math.max(1, Math.min(size, Math.max(1, maxSize)));
        // Catalog/list APIs use 0-based pages; page 0 and 1 must not both map to offset 0.
        int pageNumber = page != null ? Math.max(0, intParam(params, page.pageParam(), 0)) : 0;
        return new PageSlice(size, pageNumber * size);
    }

    private Source source(PluginManifest manifest, PluginQueryDescriptor query,
                          PluginManifest.Entity entity, String schema,
                          PluginQueryDescriptor.Scope scope,
                          Map<String, Value> params, boolean withExists) {
        StringBuilder from = new StringBuilder(" FROM ")
                .append(qualified(schema, entity.table())).append(" t");
        List<String> where = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        if (scope != PluginQueryDescriptor.Scope.SYSTEM && entity.fields().contains("tenant_id")) {
            where.add(query.systemRow()
                    ? "t." + quote("tenant_id") + " IS NULL"
                    : tenantPredicate("t", scope));
        }

        int joinIndex = 0;
        for (PluginQueryDescriptor.Join join : query.joins()) {
            PluginManifest.Relation relation = entity.relations().get(join.relation());
            if (relation == null) {
                throw invalid(query, "unknown relation " + join.relation());
            }
            PluginManifest.Entity target = manifest.entities().get(relation.targetEntity());
            if (target == null) {
                throw invalid(query, "cross-plugin relation " + join.relation() + " is not available");
            }
            if (relation.localField().isBlank() || relation.targetField().isBlank()) {
                throw invalid(query, "relation " + join.relation() + " has no join fields");
            }
            String alias = "j" + joinIndex++;
            StringBuilder on = new StringBuilder(" ON t.")
                    .append(quote(relation.localField()))
                    .append(" = ").append(alias).append('.').append(quote(relation.targetField()));
            if (scope != PluginQueryDescriptor.Scope.SYSTEM && target.fields().contains("tenant_id")) {
                on.append(" AND ").append(tenantPredicate(alias, scope));
            }
            from.append(" LEFT JOIN ").append(qualified(schema, target.table())).append(' ').append(alias)
                    .append(on);
        }

        for (PluginQueryDescriptor.Filter filter : query.filters()) {
            requireField(entity, query, filter.field());
            if (!FILTER_OPS.contains(filter.op())) {
                throw invalid(query, "unsupported filter operator " + filter.op());
            }
            if ("EFFECTIVE_AT".equals(filter.op())) {
                if (!entity.fields().contains("valid_from") || !entity.fields().contains("valid_to")) {
                    throw invalid(query, "entity has no validity range");
                }
                Value value = params.get(filter.param());
                if (value == null || value.hasNullValue()
                        || value.getKindCase() == Value.KindCase.KIND_NOT_SET) {
                    if (filter.required()) {
                        throw missing(query, filter.param());
                    }
                    continue;
                }
                Object at = toJava(value);
                where.add("(t." + quote("valid_from") + " <= ? AND (t." + quote("valid_to")
                        + " IS NULL OR t." + quote("valid_to") + " > ?))");
                values.add(at);
                values.add(at);
                continue;
            }
            String column = "t." + quote(filter.field());
            Value value = params.get(filter.param());
            if ("IS_NULL".equals(filter.op())) {
                where.add(column + " IS NULL");
                continue;
            }
            if ("IS_NOT_NULL".equals(filter.op())) {
                where.add(column + " IS NOT NULL");
                continue;
            }
            if (value == null || value.hasNullValue() || value.getKindCase() == Value.KindCase.KIND_NOT_SET) {
                if (filter.required()) {
                    throw missing(query, filter.param());
                }
                continue;
            }
            switch (filter.op()) {
                case "IN" -> {
                    List<Value> items = value.hasListValue()
                            ? value.getListValue().getValuesList()
                            : List.of(value);
                    if (items.isEmpty()) {
                        where.add("1 = 0");
                    } else {
                        List<String> marks = new ArrayList<>();
                        for (Value item : items) {
                            marks.add("?");
                            values.add(toJava(item));
                        }
                        where.add(column + " IN (" + String.join(", ", marks) + ")");
                    }
                }
                case "BETWEEN" -> {
                    ListValue list = value.getListValue();
                    if (list.getValuesCount() != 2) {
                        throw invalid(query, "BETWEEN requires two values");
                    }
                    where.add(column + " BETWEEN ? AND ?");
                    values.add(toJava(list.getValues(0)));
                    values.add(toJava(list.getValues(1)));
                }
                case "ILIKE", "LIKE" -> {
                    String pattern = scalarText(value);
                    if (filter.contains()) {
                        pattern = "%" + pattern + "%";
                    }
                    where.add(column + " " + filter.op() + " ?");
                    values.add(pattern);
                }
                case "EQ" -> {
                    where.add(column + " = ?");
                    values.add(toJava(value));
                }
                case "LOWER_EQ" -> {
                    where.add("LOWER(" + column + ") = LOWER(?)");
                    values.add(toJava(value));
                }
                case "NE" -> {
                    where.add(column + " <> ?");
                    values.add(toJava(value));
                }
                case "GT" -> {
                    where.add(column + " > ?");
                    values.add(toJava(value));
                }
                case "GTE" -> {
                    where.add(column + " >= ?");
                    values.add(toJava(value));
                }
                case "LT" -> {
                    where.add(column + " < ?");
                    values.add(toJava(value));
                }
                case "LTE" -> {
                    where.add(column + " <= ?");
                    values.add(toJava(value));
                }
                default -> throw invalid(query, "unsupported filter operator " + filter.op());
            }
        }
        for (PluginQueryDescriptor.Search search : query.search()) {
            Value value = params.get(search.param());
            if (value == null || value.hasNullValue()
                    || value.getKindCase() == Value.KindCase.KIND_NOT_SET) {
                continue;
            }
            String text = scalarText(value);
            if (text.isEmpty()) {
                continue;
            }
            List<String> parts = new ArrayList<>();
            for (String field : search.fields()) {
                requireField(entity, query, field);
                parts.add("t." + quote(field) + " ILIKE ?");
                values.add("%" + text + "%");
            }
            if (!parts.isEmpty()) {
                where.add("(" + String.join(" OR ", parts) + ")");
            }
        }
        if (withExists) {
            for (PluginQueryDescriptor.Exists exists : query.exists()) {
                String predicate = existsPredicate("t", manifest, query, exists, params, values, schema);
                if (predicate != null) {
                    where.add(predicate);
                }
            }
        }
        return new Source(from.toString(), where, values);
    }

    private String selectList(PluginManifest.Entity entity, PluginQueryDescriptor query) {
        List<String> columns = new ArrayList<>();
        List<String> fields = query.select().isEmpty() ? List.copyOf(entity.fields()) : query.select();
        for (String field : fields) {
            requireField(entity, query, field);
            columns.add("t." + quote(field) + " AS " + quote(field));
        }
        int joinIndex = 0;
        for (PluginQueryDescriptor.Join join : query.joins()) {
            String prefix = join.relation() + "_";
            for (String field : join.select()) {
                columns.add("j" + joinIndex + "." + quote(field) + " AS " + quote(prefix + field));
            }
            joinIndex++;
        }
        if (columns.isEmpty()) {
            throw invalid(query, "no selectable fields");
        }
        return String.join(", ", columns);
    }

    private String plainSelectList(String alias, PluginManifest.Entity entity,
                                   PluginQueryDescriptor query) {
        List<String> columns = new ArrayList<>();
        List<String> fields = query.select().isEmpty() ? List.copyOf(entity.fields()) : query.select();
        for (String field : fields) {
            requireField(entity, query, field);
            columns.add(alias + "." + quote(field) + " AS " + quote(field));
        }
        if (columns.isEmpty()) {
            throw invalid(query, "no selectable fields");
        }
        return String.join(", ", columns);
    }

    private String existsPredicate(String alias, PluginManifest manifest,
                                   PluginQueryDescriptor query, PluginQueryDescriptor.Exists exists,
                                   Map<String, Value> params, List<Object> values, String schema) {
        Value value = params.get(exists.param());
        if (value == null || value.hasNullValue()
                || value.getKindCase() == Value.KindCase.KIND_NOT_SET) {
            return null;
        }
        PluginManifest.Entity target = manifest.entities().get(exists.entity());
        if (target == null) {
            throw invalid(query, "unknown exists entity " + exists.entity());
        }
        if (!target.fields().contains(exists.remoteField())
                || !target.fields().contains(exists.filterField())) {
            throw invalid(query, "exists field is not public on " + exists.entity());
        }
        StringBuilder sql = new StringBuilder("EXISTS (SELECT 1 FROM ")
                .append(qualified(schema, target.table())).append(" e WHERE e.")
                .append(quote(exists.remoteField())).append(" = ")
                .append(alias).append('.').append(quote(exists.localField()))
                .append(" AND e.").append(quote(exists.filterField())).append(" = ?");
        values.add(toJava(value));
        if (exists.effectiveParam() != null) {
            Value effective = params.get(exists.effectiveParam());
            if (effective == null || effective.hasNullValue()
                    || effective.getKindCase() == Value.KindCase.KIND_NOT_SET) {
                throw missing(query, exists.effectiveParam());
            }
            Object at = toJava(effective);
            sql.append(" AND e.").append(quote("valid_from")).append(" <= ?")
                    .append(" AND (e.").append(quote("valid_to")).append(" IS NULL OR e.")
                    .append(quote("valid_to")).append(" > ?)");
            values.add(at);
            values.add(at);
        }
        if (exists.status() != null) {
            sql.append(" AND e.").append(quote("status")).append(" = ").append(literal(exists.status()));
        }
        if (exists.tenantScope() != PluginQueryDescriptor.Scope.SYSTEM) {
            sql.append(" AND ").append(tenantPredicate("e", exists.tenantScope()));
        }
        return sql.append(")").toString();
    }

    private String postPredicate(String alias, PluginManifest.Entity entity,
                                 PluginQueryDescriptor query, PluginQueryDescriptor.PostFilter filter) {
        requireField(entity, query, filter.field());
        String column = alias + "." + quote(filter.field());
        return switch (filter.op()) {
            case "EQ" -> column + " = " + literal(filter.value());
            case "NE" -> column + " <> " + literal(filter.value());
            case "IS_NULL" -> column + " IS NULL";
            case "IS_NOT_NULL" -> column + " IS NOT NULL";
            default -> throw invalid(query, "unsupported post filter operator " + filter.op());
        };
    }

    private static String literal(String value) {
        if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
            return value.toLowerCase();
        }
        if (value.matches("-?\\d+(\\.\\d+)?")) {
            return value;
        }
        return "'" + value.replace("'", "''") + "'";
    }

    private List<String> returning(PluginManifest.Entity entity, PluginQueryDescriptor query) {
        List<String> fields = query.returning().isEmpty() ? List.of(primaryKey(entity)) : query.returning();
        List<String> quoted = new ArrayList<>();
        for (String field : fields) {
            requireField(entity, query, field);
            quoted.add(quote(field));
        }
        if (quoted.isEmpty()) {
            throw invalid(query, "no returning fields");
        }
        return quoted;
    }

    private String primaryKey(PluginManifest.Entity entity) {
        return entity.fields().contains("id") ? "id" : entity.fields().iterator().next();
    }

    private void requireField(PluginManifest.Entity entity, PluginQueryDescriptor query, String field) {
        if (field == null || field.isBlank() || !entity.fields().contains(field)) {
            throw invalid(query, "field " + field + " is not public on " + entity.name());
        }
    }

    private String direction(String value) {
        return "DESC".equalsIgnoreCase(value) ? "DESC" : "ASC";
    }

    private Object required(Map<String, Value> params, PluginQueryDescriptor query, String param) {
        Value value = params.get(param);
        if (value == null || value.hasNullValue() || value.getKindCase() == Value.KindCase.KIND_NOT_SET) {
            throw missing(query, param);
        }
        return toJava(value);
    }

    private int intParam(Map<String, Value> params, String param, int defaultValue) {
        Value value = params.get(param);
        if (value == null || !value.hasNumberValue()) {
            if (value != null && value.hasStringValue()) {
                try {
                    return Integer.parseInt(value.getStringValue());
                } catch (NumberFormatException ignored) {
                    return defaultValue;
                }
            }
            return defaultValue;
        }
        return (int) value.getNumberValue();
    }

    private Integer intParamValue(Map<String, Value> params, String param) {
        Value value = params.get(param);
        if (value == null || value.hasNullValue()) {
            return null;
        }
        if (value.hasNumberValue()) {
            return (int) value.getNumberValue();
        }
        if (value.hasStringValue()) {
            try {
                return Integer.parseInt(value.getStringValue());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    static Object toJava(Value value) {
        return switch (value.getKindCase()) {
            case NULL_VALUE, KIND_NOT_SET -> null;
            case BOOL_VALUE -> value.getBoolValue();
            case NUMBER_VALUE -> number(value.getNumberValue());
            case STRING_VALUE -> materialize(value.getStringValue());
            case LIST_VALUE -> value.getListValue().getValuesList().stream()
                    .map(PluginQueryCompiler::toJava).toList();
            case STRUCT_VALUE -> value.getStructValue().toString();
        };
    }

    private static Object number(double raw) {
        if (raw == Math.rint(raw) && Math.abs(raw) <= 9_007_199_254_740_991d) {
            return (long) raw;
        }
        return BigDecimal.valueOf(raw);
    }

    private static Object materialize(String raw) {
        if (raw == null) {
            return null;
        }
        if (raw.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
            return UUID.fromString(raw);
        }
        if (raw.length() >= 10 && raw.charAt(4) == '-' && raw.charAt(7) == '-') {
            try {
                if (raw.length() == 10) {
                    return LocalDate.parse(raw);
                }
                return OffsetDateTime.parse(raw);
            } catch (DateTimeParseException ignored) {
                try {
                    return Instant.parse(raw);
                } catch (DateTimeParseException ignoredAgain) {
                    // fall through to string
                }
            }
        }
        return raw;
    }

    private static String scalarText(Value value) {
        return value.hasStringValue() ? value.getStringValue()
                : value.hasNumberValue() ? String.valueOf(value.getNumberValue())
                : value.getBoolValue() ? "true" : "";
    }

    private static String qualified(String schema, String table) {
        return quote(schema) + "." + quote(table);
    }

    private static String tenantPredicate(String alias, PluginQueryDescriptor.Scope scope) {
        String column = alias + "." + quote("tenant_id");
        if (scope == PluginQueryDescriptor.Scope.TENANT) {
            return column + " = current_setting('app.tenant_id')::uuid";
        }
        if (scope == PluginQueryDescriptor.Scope.TENANT_OR_SYSTEM) {
            return "(" + column + " = current_setting('app.tenant_id')::uuid OR "
                    + column + " IS NULL)";
        }
        return "TRUE";
    }

    private static String quote(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }

    private PluginDataException invalid(PluginQueryDescriptor query, String detail) {
        return new PluginDataException(PluginDataException.Code.INVALID_QUERY,
                "PLUGIN_DATA_QUERY_INVALID:" + query.id() + ":" + detail);
    }

    private PluginDataException missing(PluginQueryDescriptor query, String param) {
        return new PluginDataException(PluginDataException.Code.PARAM_MISSING,
                "PLUGIN_DATA_PARAM_MISSING:" + query.id() + ":" + param);
    }
}
