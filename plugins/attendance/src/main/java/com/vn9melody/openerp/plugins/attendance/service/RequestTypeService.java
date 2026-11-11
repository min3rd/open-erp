package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.*;

@ApplicationScoped
public class RequestTypeService {

    public static final Set<String> SYSTEM_CODES = Set.of(
            "LEAVE",
            "OVERTIME",
            "ATTENDANCE_FIX",
            "LATE_EARLY",
            "BUSINESS_TRIP",
            "SHIFT_SWAP"
    );

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    @Inject
    ObjectMapper objectMapper;

    public void ensureSeedTypes() {
        // Ensure 6 system types exist
        for (String code : SYSTEM_CODES) {
            PluginQueryResult res = client.query("attendance.request_type.get_by_code", Map.of("code", code));
            if (res.rows().isEmpty()) {
                seedSystemType(code);
            }
        }
    }

    public List<RequestTypeDto> listRequestTypes(boolean activeOnly) {
        ensureSeedTypes();
        Map<String, Object> params = new LinkedHashMap<>();
        if (activeOnly) {
            params.put("is_active", true);
        }
        PluginQueryResult result = client.query("attendance.request_type.list", params);
        List<RequestTypeDto> list = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            list.add(mapRequestTypeRow(row));
        }
        return list;
    }

    public RequestTypeDto getRequestType(UUID id) {
        PluginQueryResult result = client.query("attendance.request_type.get_by_id", Map.of("id", id));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_REQUEST_NOT_FOUND,
                    "Request type not found", Map.of("id", id.toString()));
        }
        return mapRequestTypeRow(result.rows().get(0));
    }

    public RequestTypeDto getRequestTypeByCode(String code) {
        ensureSeedTypes();
        PluginQueryResult result = client.query("attendance.request_type.get_by_code", Map.of("code", code.trim().toUpperCase()));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_REQUEST_NOT_FOUND,
                    "Request type not found for code: " + code, Map.of("code", code));
        }
        return mapRequestTypeRow(result.rows().get(0));
    }

    public RequestTypeDto createCustomType(RequestTypeCreateRequest req) {
        if (req == null || req.code() == null || req.code().isBlank() || req.name() == null || req.name().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Code and Name are required for custom RequestType", Map.of());
        }

        String rawCode = req.code().trim().toUpperCase();
        String code = rawCode.startsWith("X_") ? rawCode : "X_" + rawCode;

        if (SYSTEM_CODES.contains(rawCode)) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_REQUEST_TYPE_IMMUTABLE,
                    "Cannot use system request type code for custom type", Map.of("code", rawCode));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("code", code);
        params.put("name", req.name().trim());
        params.put("is_system", false);
        params.put("is_active", true);
        params.put("form_ref", serializeJson(req.formRef()));
        params.put("workflow_definition_key", req.workflowDefinitionKey());
        params.put("status_mapping", serializeJson(Map.of())); // Custom types have empty mapping
        params.put("window_days", req.windowDays() != null ? req.windowDays() : 30);
        params.put("sort_order", req.sortOrder() != null ? req.sortOrder() : 100);

        PluginQueryResult res = client.write("attendance.request_type.insert", params);
        UUID id = UUID.fromString(res.rows().get(0).get("id").toString());
        return getRequestType(id);
    }

    public RequestTypeDto updateRequestType(UUID id, RequestTypeUpdateRequest req) {
        RequestTypeDto existing = getRequestType(id);

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("id", id);
        if (req.name() != null) params.put("name", req.name().trim());
        if (req.isActive() != null) params.put("is_active", req.isActive());
        if (req.formRef() != null) params.put("form_ref", serializeJson(req.formRef()));
        if (req.workflowDefinitionKey() != null) params.put("workflow_definition_key", req.workflowDefinitionKey());
        if (req.windowDays() != null) params.put("window_days", req.windowDays());
        if (req.sortOrder() != null) params.put("sort_order", req.sortOrder());
        params.put("updated_at", Instant.now().toString());

        client.write("attendance.request_type.update", params);
        return getRequestType(id);
    }

    public void deleteRequestType(UUID id) {
        RequestTypeDto existing = getRequestType(id);
        if (existing.isSystem()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_REQUEST_TYPE_IMMUTABLE,
                    "System request types cannot be deleted", Map.of("code", existing.code()));
        }
        client.write("attendance.request_type.delete", Map.of("id", id));
    }

    private void seedSystemType(String code) {
        String name = switch (code) {
            case "LEAVE" -> "Nghỉ phép";
            case "OVERTIME" -> "Làm thêm giờ (OT)";
            case "ATTENDANCE_FIX" -> "Giải trình công / Quên chấm công";
            case "LATE_EARLY" -> "Xin đi muộn / Về sớm";
            case "BUSINESS_TRIP" -> "Đi công tác";
            case "SHIFT_SWAP" -> "Đổi ca làm việc";
            default -> code;
        };

        int windowDays = switch (code) {
            case "ATTENDANCE_FIX", "LATE_EARLY" -> 7;
            case "OVERTIME", "SHIFT_SWAP" -> 15;
            default -> 30;
        };

        int sortOrder = switch (code) {
            case "LEAVE" -> 1;
            case "OVERTIME" -> 2;
            case "ATTENDANCE_FIX" -> 3;
            case "LATE_EARLY" -> 4;
            case "BUSINESS_TRIP" -> 5;
            case "SHIFT_SWAP" -> 6;
            default -> 99;
        };

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("code", code);
        params.put("name", name);
        params.put("is_system", true);
        params.put("is_active", true);
        params.put("form_ref", null);
        params.put("workflow_definition_key", "attendance-request-" + code.toLowerCase());
        params.put("status_mapping", serializeJson(Map.of("target", code)));
        params.put("window_days", windowDays);
        params.put("sort_order", sortOrder);

        try {
            client.write("attendance.request_type.insert", params);
        } catch (Exception ignored) {}
    }

    private RequestTypeDto mapRequestTypeRow(Map<String, Object> row) {
        UUID id = UUID.fromString(row.get("id").toString());
        String code = (String) row.get("code");
        String name = (String) row.get("name");
        boolean isSystem = Boolean.TRUE.equals(row.get("is_system"));
        boolean isActive = Boolean.TRUE.equals(row.get("is_active"));
        Map<String, Object> formRef = parseJson(row.get("form_ref"));
        String wfKey = (String) row.get("workflow_definition_key");
        Map<String, Object> statusMapping = parseJson(row.get("status_mapping"));
        int windowDays = row.get("window_days") != null ? ((Number) row.get("window_days")).intValue() : 30;
        int sortOrder = row.get("sort_order") != null ? ((Number) row.get("sort_order")).intValue() : 0;
        Instant createdAt = row.get("created_at") != null ? Instant.parse(row.get("created_at").toString()) : Instant.now();
        Instant updatedAt = row.get("updated_at") != null ? Instant.parse(row.get("updated_at").toString()) : Instant.now();

        return new RequestTypeDto(id, code, name, isSystem, isActive, formRef, wfKey, statusMapping, windowDays, sortOrder, createdAt, updatedAt);
    }

    private Map<String, Object> parseJson(Object val) {
        if (val == null) return Map.of();
        if (val instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> m = (Map<String, Object>) val;
            return m;
        }
        try {
            return objectMapper.readValue(val.toString(), new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private String serializeJson(Object val) {
        if (val == null) return null;
        try {
            return objectMapper.writeValueAsString(val);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}

