package com.vn9melody.openerp.plugins.office.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record OfficeDocumentVersionDto(
        UUID id,
        UUID documentId,
        int versionNumber,
        long sizeBytes,
        String storageKey,
        String checksumSha256,
        String changeNote,
        UUID createdBy,
        Instant createdAt) {

    public static OfficeDocumentVersionDto from(Map<String, Object> row) {
        return new OfficeDocumentVersionDto(
                uuid(row.get("id")),
                uuid(row.get("document_id")),
                (int) number(row.get("version_number")),
                number(row.get("size_bytes")),
                text(row.get("storage_key")),
                text(row.get("checksum_sha256")),
                text(row.get("change_note")),
                uuid(row.get("created_by")),
                instant(row.get("created_at")));
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static long number(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
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
