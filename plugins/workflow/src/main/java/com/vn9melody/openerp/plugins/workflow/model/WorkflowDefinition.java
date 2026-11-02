package com.vn9melody.openerp.plugins.workflow.model;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@com.fasterxml.jackson.databind.annotation.JsonNaming(com.fasterxml.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WorkflowDefinition(
        UUID id,
        String key,
        Integer version,
        String status,
        Map<String, Object> document,
        UUID createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime publishedAt) {

    private static final List<String> SELECT_FIELDS = List.of(
            "id", "key", "version", "status", "document", "created_by", "created_at", "published_at");

    public static List<String> selectFields() {
        return SELECT_FIELDS;
    }

    public static WorkflowDefinition from(Map<String, Object> row) {
        return new WorkflowDefinition(
                uuid(row.get("id")),
                str(row.get("key")),
                intOrNull(row.get("version")),
                str(row.get("status")),
                map(row.get("document")),
                uuid(row.get("created_by")),
                time(row.get("created_at")),
                time(row.get("published_at")));
    }

    private static UUID uuid(Object value) {
        return value == null ? null : UUID.fromString(value.toString());
    }

    private static String str(Object value) {
        return value == null ? null : value.toString();
    }

    private static OffsetDateTime time(Object value) {
        return value == null ? null : OffsetDateTime.parse(value.toString());
    }

    private static Integer intOrNull(Object value) {
        return value instanceof Number n ? n.intValue() : null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object value) {
        if (value instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        if (value instanceof String s && !s.isBlank()) {
            try {
                return (Map<String, Object>) new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(s, Map.class);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
