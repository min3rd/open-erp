package com.vn9melody.openerp.plugins.form.model;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record FormResponse(
        UUID id,
        UUID formId,
        Integer formVersion,
        Map<String, Object> answers,
        String responderEmail,
        UUID submittedByUserId,
        String entityWriteStatus,
        String entityWriteError,
        OffsetDateTime submittedAt) {

    private static final List<String> SELECT_FIELDS = List.of(
            "id", "form_id", "form_version", "answers", "responder_email",
            "submitted_by_user_id", "entity_write_status", "entity_write_error", "submitted_at");

    public static List<String> selectFields() {
        return SELECT_FIELDS;
    }

    public static FormResponse from(Map<String, Object> row) {
        return new FormResponse(
                uuid(row.get("id")),
                uuid(row.get("form_id")),
                intOrNull(row.get("form_version")),
                map(row.get("answers")),
                str(row.get("responder_email")),
                uuid(row.get("submitted_by_user_id")),
                str(row.get("entity_write_status")),
                str(row.get("entity_write_error")),
                time(row.get("submitted_at")));
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
