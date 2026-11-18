package com.vn9melody.openerp.plugins.office.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record OfficeDocumentDto(
        UUID id,
        String title,
        String originalFilename,
        String fileExtension,
        String docType,
        String mimeType,
        long sizeBytes,
        String checksumSha256,
        int currentVersion,
        String status,
        UUID createdBy,
        UUID updatedBy,
        Instant createdAt,
        Instant updatedAt,
        Instant deletedAt) {

    public static OfficeDocumentDto from(Map<String, Object> row) {
        return new OfficeDocumentDto(
                uuid(row.get("id")),
                text(row.get("title")),
                text(row.get("original_filename")),
                text(row.get("file_extension")),
                text(row.get("doc_type")),
                text(row.get("mime_type")),
                number(row.get("size_bytes")),
                text(row.get("checksum_sha256")),
                (int) number(row.get("current_version")),
                text(row.get("status")),
                uuid(row.get("created_by")),
                uuid(row.get("updated_by")),
                instant(row.get("created_at")),
                instant(row.get("updated_at")),
                instant(row.get("deleted_at")));
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
        String text = String.valueOf(value);
        try {
            return Instant.parse(text);
        } catch (RuntimeException ignored) {
            return null;
        }
    }
}
