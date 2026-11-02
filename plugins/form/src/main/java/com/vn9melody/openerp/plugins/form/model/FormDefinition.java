package com.vn9melody.openerp.plugins.form.model;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record FormDefinition(
        UUID id,
        String slug,
        String titleText,
        String description,
        Map<String, Object> document,
        Map<String, Object> entityMapping,
        String publishStatus,
        String captcha,
        OffsetDateTime closeAt,
        Integer responseLimit,
        Boolean acceptResponses,
        Integer latestVersion,
        UUID createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

    private static final List<String> SELECT_FIELDS = List.of(
            "id", "slug", "title_text", "description", "document", "entity_mapping",
            "publish_status", "captcha", "close_at", "response_limit", "accept_responses",
            "latest_version", "created_by", "created_at", "updated_at");

    public static List<String> selectFields() {
        return SELECT_FIELDS;
    }

    public static FormDefinition from(Map<String, Object> row) {
        return new FormDefinition(
                uuid(row.get("id")),
                str(row.get("slug")),
                str(row.get("title_text")),
                str(row.get("description")),
                map(row.get("document")),
                map(row.get("entity_mapping")),
                str(row.get("publish_status")),
                str(row.get("captcha")),
                time(row.get("close_at")),
                intOrNull(row.get("response_limit")),
                boolOrNull(row.get("accept_responses")),
                intOrNull(row.get("latest_version")),
                uuid(row.get("created_by")),
                time(row.get("created_at")),
                time(row.get("updated_at")));
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

    private static Boolean boolOrNull(Object value) {
        return value instanceof Boolean b ? b : null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object value) {
        if (value instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        // The data gateway returns jsonb columns as JSON strings.
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
