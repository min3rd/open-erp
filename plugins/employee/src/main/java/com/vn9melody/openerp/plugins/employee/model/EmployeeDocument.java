package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Employee document metadata; binary content lives in plugin-local storage. */
public class EmployeeDocument {

    public UUID id;
    public UUID employeeId;
    public String documentType;
    public Integer version;
    public String storageKey;
    public String fileName;
    public String mimeType;
    public Long sizeBytes;
    public String checksum;
    public String scanStatus;
    public UUID uploadedBy;
    public String uploadSource;
    public LocalDate retentionUntil;
    public String status;
    public Instant createdAt;

    public static EmployeeDocument from(Map<String, Object> row) {
        EmployeeDocument item = new EmployeeDocument();
        item.id = Rows.uuid(row.get("id"));
        item.employeeId = Rows.uuid(row.get("employee_id"));
        item.documentType = Rows.text(row.get("document_type"));
        item.version = Rows.integer(row.get("version"));
        item.storageKey = Rows.text(row.get("storage_key"));
        item.fileName = Rows.text(row.get("file_name"));
        item.mimeType = Rows.text(row.get("mime_type"));
        item.sizeBytes = Rows.longValue(row.get("size_bytes"));
        item.checksum = Rows.text(row.get("checksum"));
        item.scanStatus = Rows.text(row.get("scan_status"));
        item.uploadedBy = Rows.uuid(row.get("uploaded_by"));
        item.uploadSource = Rows.text(row.get("upload_source"));
        item.retentionUntil = Rows.date(row.get("retention_until"));
        item.status = Rows.text(row.get("status"));
        item.createdAt = Rows.instant(row.get("created_at"));
        return item;
    }
}
