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
            "BETWEEN", "IS_NULL", "IS_NOT_NULL");

    public record CompiledQuery(String sql, List<Object> params,
                                String countSql, List<Object> countParams) {}

    public CompiledQuery compile(PluginManifest manifest, PluginQueryDescriptor query,
                                 Map<String, Value> params, String schema, boolean tenantScoped) {
        return switch (query.operation()) {
            case LIST -> list(manifest, query, params, schema, tenantScoped);
            case GET -> get(manifest, query, params, schema, tenantScoped);
            case INSERT -> insert(manifest, query, params, schema, tenantScoped);
            case UPDATE -> update(manifest, query, params, schema, tenantScoped);
            case DELETE -> delete(manifest, query, params, schema, tenantScoped);
        };
    }

    private CompiledQuery list(PluginManifest manifest, PluginQueryDescriptor query,
                               Map<String, Value> params, String schema, boolean tenantScoped) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        Source source = source(manifest, query, entity, schema, tenantScoped, params);
        String where = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);

        List<Object> sqlParams = new ArrayList<>(source.params);
        StringBuilder sql = new StringBuilder("SELECT ").append(selectList(entity, query))
                .append(source.from).append(where);

        if (!query.sort().isEmpty()) {
            List<String> order = new ArrayList<>();
            for (PluginQueryDescriptor.Sort sort : query.sort()) {
                requireField(entity, query, sort.field());
                order.add("t." + quote(sort.field()) + " " + direction(sort.direction()));
            }
            sql.append(" ORDER BY ").append(String.join(", ", order));
        } else {
            sql.append(" ORDER BY t.").append(quote(primaryKey(entity))).append(" ASC");
        }

        PluginQueryDescriptor.Page page = query.page();
        int defaultSize = page != null ? page.defaultSize() : 20;
        int maxSize = query.maxRows() > 0 ? query.maxRows() : (page != null ? page.maxSize() : 100);
        int size = page != null ? intParam(params, page.sizeParam(), defaultSize) : defaultSize;
        size = Math.max(1, Math.min(size, Math.max(1, maxSize)));
        int pageNumber = page != null ? Math.max(1, intParam(params, page.pageParam(), 1)) : 1;
        sql.append(" LIMIT ? OFFSET ?");
        sqlParams.add(size);
        sqlParams.add((pageNumber - 1) * size);

        String countSql = "SELECT count(*) AS \"total\"" + source.from + where;
        return new CompiledQuery(sql.toString(), sqlParams, countSql, new ArrayList<>(source.params));
    }

    private CompiledQuery get(PluginManifest manifest, PluginQueryDescriptor query,
                              Map<String, Value> params, String schema, boolean tenantScoped) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        Source source = source(manifest, query, entity, schema, tenantScoped, params);
        String where = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);
        String sql = "SELECT " + selectList(entity, query) + source.from + where + " LIMIT 1";
        return new CompiledQuery(sql, new ArrayList<>(source.params), null, List.of());
    }

    private CompiledQuery insert(PluginManifest manifest, PluginQueryDescriptor query,
                                 Map<String, Value> params, String schema, boolean tenantScoped) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        if (query.values().isEmpty()) {
            throw invalid(query, "INSERT descriptor has no values");
        }
        if (tenantScoped && query.values().containsKey("tenant_id")) {
            throw invalid(query, "tenant_id is managed by the gateway");
        }
        List<String> columns = new ArrayList<>();
        List<String> placeholders = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, String> entry : query.values().entrySet()) {
            requireField(entity, query, entry.getKey());
            columns.add(quote(entry.getKey()));
            placeholders.add("?");
            values.add(required(params, query, entry.getValue()));
        }
        if (tenantScoped) {
            if (!entity.fields().contains("tenant_id")) {
                throw invalid(query, "tenant-scoped entity has no tenant_id");
            }
            columns.add(quote("tenant_id"));
            placeholders.add("current_setting('app.tenant_id')::uuid");
        }
        List<String> returning = returning(entity, query);
        String sql = "INSERT INTO " + qualified(schema, entity.table())
                + " (" + String.join(", ", columns) + ")"
                + " VALUES (" + String.join(", ", placeholders) + ")"
                + " RETURNING " + String.join(", ", returning);
        return new CompiledQuery(sql, values, null, List.of());
    }

    private CompiledQuery update(PluginManifest manifest, PluginQueryDescriptor query,
                                 Map<String, Value> params, String schema, boolean tenantScoped) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        if (query.values().isEmpty()) {
            throw invalid(query, "UPDATE descriptor has no values");
        }
        if (query.values().containsKey("tenant_id")) {
            throw invalid(query, "tenant_id is managed by the gateway");
        }
        if (query.filters().isEmpty()) {
            throw invalid(query, "UPDATE descriptor must declare a filter");
        }
        Source source = source(manifest, query, entity, schema, tenantScoped, params);
        List<String> assignments = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, String> entry : query.values().entrySet()) {
            requireField(entity, query, entry.getKey());
            assignments.add(quote(entry.getKey()) + " = ?");
            values.add(required(params, query, entry.getValue()));
        }
        values.addAll(source.params);
        String where = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);
        String sql = "UPDATE " + qualified(schema, entity.table()) + " t"
                + " SET " + String.join(", ", assignments) + where
                + " RETURNING " + String.join(", ", returning(entity, query));
        return new CompiledQuery(sql, values, null, List.of());
    }

    private CompiledQuery delete(PluginManifest manifest, PluginQueryDescriptor query,
                                 Map<String, Value> params, String schema, boolean tenantScoped) {
        PluginManifest.Entity entity = manifest.requireEntity(query.entity());
        if (query.filters().isEmpty()) {
            throw invalid(query, "DELETE descriptor must declare a filter");
        }
        Source source = source(manifest, query, entity, schema, tenantScoped, params);
        String where = source.where.isEmpty() ? "" : " WHERE " + String.join(" AND ", source.where);
        String sql = "DELETE FROM " + qualified(schema, entity.table()) + " t" + where
                + " RETURNING " + String.join(", ", returning(entity, query));
        return new CompiledQuery(sql, new ArrayList<>(source.params), null, List.of());
    }

    private record Source(String from, List<String> where, List<Object> params) {}

    private Source source(PluginManifest manifest, PluginQueryDescriptor query,
                          PluginManifest.Entity entity, String schema, boolean tenantScoped,
                          Map<String, Value> params) {
        StringBuilder from = new StringBuilder(" FROM ")
                .append(qualified(schema, entity.table())).append(" t");
        List<String> where = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        if (tenantScoped) {
            if (!entity.fields().contains("tenant_id")) {
                throw invalid(query, "tenant-scoped entity has no tenant_id");
            }
            where.add("t." + quote("tenant_id") + " = current_setting('app.tenant_id')::uuid");
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
            if (tenantScoped) {
                if (!target.fields().contains("tenant_id")) {
                    throw invalid(query, "tenant-scoped join target has no tenant_id");
                }
                on.append(" AND ").append(alias).append('.').append(quote("tenant_id"))
                        .append(" = current_setting('app.tenant_id')::uuid");
            }
            from.append(" LEFT JOIN ").append(qualified(schema, target.table())).append(' ').append(alias)
                    .append(on);
        }

        for (PluginQueryDescriptor.Filter filter : query.filters()) {
            requireField(entity, query, filter.field());
            if (!FILTER_OPS.contains(filter.op())) {
                throw invalid(query, "unsupported filter operator " + filter.op());
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

    private List<String> returning(PluginManifest.Entity entity, PluginQueryDescriptor query) {
        List<String> fields = query.returning().isEmpty() ? List.of(primaryKey(entity)) : query.returning();
        List<String> quoted = new ArrayList<>();
        for (String field : fields) {
            requireField(entity, query, field);
            if ("tenant_id".equals(field)) {
                continue;
            }
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
