package com.vn9melody.openerp.plugins.office.dto;

public record CreateOfficeDocumentRequest(
        String title,
        String originalFilename,
        String fileExtension,
        String docType,
        String mimeType,
        Long sizeBytes) {
}
