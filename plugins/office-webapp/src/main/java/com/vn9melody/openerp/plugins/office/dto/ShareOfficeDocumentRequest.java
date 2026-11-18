package com.vn9melody.openerp.plugins.office.dto;

import java.util.UUID;

public record ShareOfficeDocumentRequest(String subjectType, UUID subjectId, String permission) {
}
