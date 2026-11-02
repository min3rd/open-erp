package com.vn9melody.openerp.plugins.workflow.model;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@com.fasterxml.jackson.databind.annotation.JsonNaming(com.fasterxml.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WorkflowInstance(
        UUID id,
        UUID definitionId,
        Integer definitionVersion,
        String status,
        String outcome,
        String triggerType,
        Map<String, Object> sourceRef,
        Map<String, Object> context,
        UUID initiatedBy,
        OffsetDateTime createdAt,
        OffsetDateTime completedAt) {

    private static final List<String> SELECT_FIELDS = List.of(
            "id", "definition_id", "definition_version", "status", "outcome", "trigger_type",
            "source_ref", "context", "initiated_by", "created_at", "completed_at");

    public static List<String> selectFields() {
        return SELECT_FIELDS;
    }

    public static WorkflowInstance from(Map<String, Object> row) {
        return new WorkflowInstance(
                uuid(row.get("id")),
                uuid(row.get("definition_id")),
                intOrNull(row.get("definition_version")),
                str(row.get("status")),
                str(row.get("outcome")),
                str(row.get("trigger_type")),
                map(row.get("source_ref")),
                map(row.get("context")),
                uuid(row.get("initiated_by")),
                time(row.get("created_at")),
                time(row.get("completed_at")));
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
