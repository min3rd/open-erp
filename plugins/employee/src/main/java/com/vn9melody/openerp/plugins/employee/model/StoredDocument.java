package com.vn9melody.openerp.plugins.employee.model;

import java.io.File;

/** A stored document resolved for streaming; never serialized as JSON. */
public record StoredDocument(File file, String fileName, String mimeType) {
}
