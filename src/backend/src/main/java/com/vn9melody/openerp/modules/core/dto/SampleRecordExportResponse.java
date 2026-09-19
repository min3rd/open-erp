package com.vn9melody.openerp.modules.core.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Metadata response of the export operation (Khuôn Mẫu 1). The reference entity
 * stores the generated content inline as a data URL so no storage service is
 * required in Sprint 02 (TASK-284).
 */
public class SampleRecordExportResponse {

    @JsonProperty("file_url")
    public String fileUrl;

    @JsonProperty("download_url")
    public String downloadUrl;

    @JsonProperty("format")
    public String format;

    @JsonProperty("total_records")
    public long totalRecords;

    @JsonProperty("expires_at")
    public String expiresAt;

    public SampleRecordExportResponse() {
    }

    public SampleRecordExportResponse(String fileUrl, String downloadUrl, String format, long totalRecords) {
        this.fileUrl = fileUrl;
        this.downloadUrl = downloadUrl;
        this.format = format;
        this.totalRecords = totalRecords;
    }
}
