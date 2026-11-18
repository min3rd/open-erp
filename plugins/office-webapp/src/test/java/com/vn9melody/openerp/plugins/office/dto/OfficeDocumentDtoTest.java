package com.vn9melody.openerp.plugins.office.dto;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class OfficeDocumentDtoTest {

    @Test
    void mapsGatewayRow() {
        UUID id = UUID.randomUUID();
        UUID user = UUID.randomUUID();
        Map<String, Object> row = new HashMap<>();
        row.put("id", id.toString());
        row.put("title", "Báo cáo Q4");
        row.put("original_filename", "bao_cao_q4.xlsx");
        row.put("file_extension", "xlsx");
        row.put("doc_type", "EXCEL");
        row.put("mime_type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        row.put("size_bytes", 48290L);
        row.put("checksum_sha256", "abc");
        row.put("current_version", 3L);
        row.put("status", "ACTIVE");
        row.put("created_by", user.toString());
        row.put("updated_by", user.toString());
        row.put("created_at", "2026-11-15T05:00:00Z");
        row.put("updated_at", "2026-11-15T05:10:00Z");

        OfficeDocumentDto dto = OfficeDocumentDto.from(row);

        assertEquals(id, dto.id());
        assertEquals("Báo cáo Q4", dto.title());
        assertEquals("xlsx", dto.fileExtension());
        assertEquals("EXCEL", dto.docType());
        assertEquals(48290L, dto.sizeBytes());
        assertEquals(3, dto.currentVersion());
        assertEquals(Instant.parse("2026-11-15T05:00:00Z"), dto.createdAt());
        assertNull(dto.deletedAt());
    }

    @Test
    void toleratesMissingOptionalFields() {
        OfficeDocumentDto dto = OfficeDocumentDto.from(Map.of("title", "Doc"));
        assertEquals("Doc", dto.title());
        assertNull(dto.id());
        assertEquals(0L, dto.sizeBytes());
        assertEquals(0, dto.currentVersion());
        assertNull(dto.createdAt());
    }
}
