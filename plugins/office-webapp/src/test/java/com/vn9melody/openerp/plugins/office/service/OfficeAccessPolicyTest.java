package com.vn9melody.openerp.plugins.office.service;

import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentDto;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentPermissionDto;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OfficeAccessPolicyTest {

    private final UUID owner = UUID.randomUUID();
    private final UUID reader = UUID.randomUUID();
    private final UUID writer = UUID.randomUUID();
    private final OfficeDocumentDto document = new OfficeDocumentDto(
            UUID.randomUUID(), "Doc", "doc.docx", "docx", "WORD", "mime", 10, "sha", 1, "ACTIVE",
            owner, owner, Instant.now(), Instant.now(), null);

    @Test
    void ownerCanReadWriteManage() {
        assertTrue(OfficeAccessPolicy.canRead(document, owner, false, List.of()));
        assertTrue(OfficeAccessPolicy.canWrite(document, owner, false, List.of()));
        assertTrue(OfficeAccessPolicy.canManage(document, owner, false));
    }

    @Test
    void readPermissionAllowsReadOnly() {
        List<OfficeDocumentPermissionDto> permissions = List.of(permission(reader, "READ"));
        assertTrue(OfficeAccessPolicy.canRead(document, reader, false, permissions));
        assertFalse(OfficeAccessPolicy.canWrite(document, reader, false, permissions));
    }

    @Test
    void writePermissionAllowsReadAndWrite() {
        List<OfficeDocumentPermissionDto> permissions = List.of(permission(writer, "WRITE"));
        assertTrue(OfficeAccessPolicy.canRead(document, writer, false, permissions));
        assertTrue(OfficeAccessPolicy.canWrite(document, writer, false, permissions));
    }

    @Test
    void strangerHasNoAccess() {
        List<OfficeDocumentPermissionDto> permissions = List.of(permission(reader, "READ"));
        UUID stranger = UUID.randomUUID();
        assertFalse(OfficeAccessPolicy.canRead(document, stranger, false, permissions));
        assertFalse(OfficeAccessPolicy.canWrite(document, stranger, false, permissions));
        assertFalse(OfficeAccessPolicy.canManage(document, stranger, false));
    }

    @Test
    void platformBypassesAcl() {
        UUID stranger = UUID.randomUUID();
        assertTrue(OfficeAccessPolicy.canRead(document, stranger, true, List.of()));
        assertTrue(OfficeAccessPolicy.canWrite(document, stranger, true, List.of()));
    }

    private OfficeDocumentPermissionDto permission(UUID subjectId, String level) {
        return new OfficeDocumentPermissionDto(UUID.randomUUID(), document.id(), "USER", subjectId,
                level, owner, Instant.now());
    }
}
