package com.vn9melody.openerp.plugins.office.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record OfficeDocumentPermissionDto(
        UUID id,
        UUID documentId,
        String subjectType,
        UUID subjectId,
        String permission,
        UUID createdBy,
        Instant createdAt) {

    public static OfficeDocumentPermissionDto from(Map<String, Object> row) {
        return new OfficeDocumentPermissionDto(
                uuid(row.get("id")),
                uuid(row.get("document_id")),
                text(row.get("subject_type")),
                uuid(row.get("subject_id")),
                text(row.get("permission")),
                uuid(row.get("created_by")),
                instant(row.get("created_at")));
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static UUID uuid(Object value) {
        return value == null ? null : UUID.fromString(String.valueOf(value));
    }

    private static Instant instant(Object value) {
        if (value == null) return null;
        try {
            return Instant.parse(String.valueOf(value));
        } catch (RuntimeException ignored) {
            return null;
        }
    }
}
