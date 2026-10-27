package com.vn9melody.openerp.plugins.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugins.catalog.api.ApiFieldError;
import com.vn9melody.openerp.plugins.catalog.api.ResponseKey;
import com.vn9melody.openerp.plugins.catalog.api.CatalogResponseKey;
import java.util.List;
import java.util.Map;

/**
 * Typed request/response DTOs of the catalog import/export APIs
 * (DES-API-S05-001 section 4.1, TASK-390). The report shape is the contract the
 * Web import drawer already consumes; every key is enum-backed.
 */
public final class CatalogImportExportDtos {

    private CatalogImportExportDtos() {
    }

    /** Outcome of one imported row. */
    public enum ImportAction {
        CREATED,
        UPDATED,
        SKIPPED,
        ERROR
    }

    /** Flattened row error of the report ({@code {row, code, params}}). */
    public record ImportRowError(
        @JsonProperty(CatalogResponseKey.Json.ROW) int row,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(CatalogResponseKey.Json.PARAMS) Map<String, Object> params
    ) {
    }

    /** One row of the report ({@code {row, action, code, name, errors}}). */
    public record ImportRowResult(
        @JsonProperty(CatalogResponseKey.Json.ROW) int row,
        @JsonProperty(ResponseKey.Json.ACTION) ImportAction action,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(CatalogResponseKey.Json.ERRORS) List<ApiFieldError> errors
    ) {
    }

    /** Single-resource {@code data} of {@code POST .../import} (dry-run and write). */
    public record ImportReport(
        @JsonProperty(CatalogResponseKey.Json.DRY_RUN) boolean dryRun,
        @JsonProperty(CatalogResponseKey.Json.TOTAL_ROWS) int totalRows,
        @JsonProperty(CatalogResponseKey.Json.CREATED) int created,
        @JsonProperty(CatalogResponseKey.Json.UPDATED) int updated,
        @JsonProperty(CatalogResponseKey.Json.SKIPPED) int skipped,
        @JsonProperty(CatalogResponseKey.Json.EDGES_CREATED) int edgesCreated,
        @JsonProperty(CatalogResponseKey.Json.ERRORS) List<ImportRowError> errors,
        @JsonProperty(CatalogResponseKey.Json.ROWS) List<ImportRowResult> rows
    ) {
    }

    /** Raw CSV download (UTF-8 BOM) for template/export endpoints. */
    public record CsvFile(byte[] content, String filename) {
    }
}
