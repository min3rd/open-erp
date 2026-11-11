package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.*;

@ApplicationScoped
public class ExportTemplateService {

    public static final Set<String> ALLOWED_COLUMNS = Set.of(
            "EMPLOYEE_CODE",
            "FULL_NAME",
            "DEPARTMENT",
            "BRANCH",
            "STANDARD_DAYS",
            "ACTUAL_DAYS",
            "PAID_LEAVE_DAYS",
            "UNPAID_LEAVE_DAYS",
            "OT_NORMAL_HOURS",
            "OT_NIGHT_HOURS",
            "LATE_MINUTES",
            "EARLY_MINUTES"
    );

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    @Inject
    ObjectMapper objectMapper;

    public List<ExportTemplateDto> listTemplates() {
        PluginQueryResult result = client.query("attendance.export_template.list", Map.of());
        List<ExportTemplateDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapTemplateRow(row));
        }
        return items;
    }

    public ExportTemplateDto getTemplate(UUID id) {
        PluginQueryResult result = client.query("attendance.export_template.get_by_id", Map.of("id", id));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_EXPORT_TEMPLATE_NOT_FOUND,
                    "Export template not found", Map.of("id", id.toString()));
        }
        return mapTemplateRow(result.rows().get(0));
    }

    public ExportTemplateDto createTemplate(ExportTemplateCreateRequest req) {
        if (req == null || req.name() == null || req.name().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Template name is required", Map.of());
        }
        validateColumns(req.columns());

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("name", req.name().trim());
        params.put("columns", serializeJson(req.columns()));
        params.put("is_default", Boolean.TRUE.equals(req.isDefault()));

        PluginQueryResult result = client.write("attendance.export_template.insert", params);
        UUID id = UUID.fromString(result.rows().get(0).get("id").toString());
        return getTemplate(id);
    }

    public ExportTemplateDto updateTemplate(UUID id, ExportTemplateUpdateRequest req) {
        getTemplate(id); // Ensure exists

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", id);
        if (req.name() != null && !req.name().isBlank()) {
            params.put("name", req.name().trim());
        }
        if (req.columns() != null) {
            validateColumns(req.columns());
            params.put("columns", serializeJson(req.columns()));
        }
        if (req.isDefault() != null) {
            params.put("is_default", req.isDefault());
        }
        params.put("updated_at", Instant.now().toString());

        client.write("attendance.export_template.update", params);
        return getTemplate(id);
    }

    public void deleteTemplate(UUID id) {
        getTemplate(id); // Ensure exists
        client.write("attendance.export_template.delete", Map.of("id", id));
    }

    public void validateColumns(List<ExportTemplateColumn> cols) {
        if (cols == null || cols.isEmpty()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Columns list cannot be empty", Map.of());
        }
        for (ExportTemplateColumn col : cols) {
            if (col.key() == null || !ALLOWED_COLUMNS.contains(col.key())) {
                throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_EXPORT_COLUMN_UNKNOWN,
                        "Unknown export column: " + col.key(),
                        Map.of("column", String.valueOf(col.key()), "allowed", String.join(", ", ALLOWED_COLUMNS)));
            }
        }
    }

    private ExportTemplateDto mapTemplateRow(Map<String, Object> row) {
        UUID id = UUID.fromString(row.get("id").toString());
        String name = (String) row.get("name");
        boolean isDefault = Boolean.TRUE.equals(row.get("is_default"));
        Instant createdAt = row.get("created_at") != null ? Instant.parse(row.get("created_at").toString()) : Instant.now();
        Instant updatedAt = row.get("updated_at") != null ? Instant.parse(row.get("updated_at").toString()) : Instant.now();

        List<ExportTemplateColumn> columns = parseColumns(row.get("columns"));
        return new ExportTemplateDto(id, name, columns, isDefault, createdAt, updatedAt);
    }

    private List<ExportTemplateColumn> parseColumns(Object val) {
        if (val == null) return List.of();
        if (val instanceof List) {
            try {
                String json = objectMapper.writeValueAsString(val);
                return objectMapper.readValue(json, new TypeReference<>() {});
            } catch (Exception e) {
                return List.of();
            }
        }
        try {
            return objectMapper.readValue(val.toString(), new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String serializeJson(Object val) {
        if (val == null) return "[]";
        try {
            return objectMapper.writeValueAsString(val);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}

