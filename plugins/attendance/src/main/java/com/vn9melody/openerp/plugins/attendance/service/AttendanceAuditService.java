package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.dto.AuditDtos.AuditLogDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Plugin-local activity trail. Every sensitive attendance action writes one row
 * with the authenticated user, action code, target entity and a small JSON detail.
 */
@ApplicationScoped
public class AttendanceAuditService {

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    @Inject
    ObjectMapper objectMapper;

    public void record(String action, String entityType, UUID entityId, Map<String, Object> detail) {
        if (action == null || action.isBlank()) {
            return;
        }
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("actor_user_id", tenantContext.userId());
        params.put("action", action);
        params.put("entity_type", entityType);
        params.put("entity_id", entityId);
        params.put("detail", serializeJson(detail));
        try {
            client.write("attendance.audit.insert", params);
        } catch (RuntimeException ignored) {
            // Audit must never break the business action it records.
        }
    }

    private String serializeJson(Map<String, Object> detail) {
        try {
            return objectMapper.writeValueAsString(detail == null ? Map.of() : detail);
        } catch (Exception e) {
            return "{}";
        }
    }

    public PagedData<AuditLogDto> list(String action, String entityType, int page, int size) {
        int safePage = page > 0 ? page - 1 : 0;
        int safeSize = size > 0 ? Math.min(size, 200) : 50;
        Map<String, Object> params = new LinkedHashMap<>();
        if (action != null && !action.isBlank()) {
            params.put("action", action);
        }
        if (entityType != null && !entityType.isBlank()) {
            params.put("entity_type", entityType);
        }
        params.put("page", safePage);
        params.put("size", safeSize);

        PluginQueryResult result = client.query("attendance.audit.list", params);
        List<AuditLogDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapRow(row));
        }
        long total = result.totalRows() > 0 ? result.totalRows() : items.size();
        return PagedData.of(items, page > 0 ? page : 1, safeSize, total);
    }

    private AuditLogDto mapRow(Map<String, Object> row) {
        UUID id = row.get("id") != null ? UUID.fromString(row.get("id").toString()) : UUID.randomUUID();
        UUID actor = row.get("actor_user_id") != null ? UUID.fromString(row.get("actor_user_id").toString()) : null;
        UUID entityId = row.get("entity_id") != null ? UUID.fromString(row.get("entity_id").toString()) : null;
        String entityType = row.get("entity_type") != null ? row.get("entity_type").toString() : null;
        String action = row.get("action") != null ? row.get("action").toString() : "";
        Instant createdAt = row.get("created_at") != null ? Instant.parse(row.get("created_at").toString()) : Instant.now();
        Map<String, Object> detail = Map.of();
        Object detailObj = row.get("detail");
        if (detailObj instanceof Map<?, ?> map) {
            Map<String, Object> copy = new LinkedHashMap<>();
            map.forEach((k, v) -> copy.put(String.valueOf(k), v));
            detail = copy;
        } else if (detailObj instanceof String text && !text.isBlank()) {
            try {
                detail = objectMapper.readValue(text, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
            } catch (Exception ignored) {
                detail = Map.of();
            }
        }
        return new AuditLogDto(id, actor, action, entityType, entityId, detail, createdAt);
    }
}
