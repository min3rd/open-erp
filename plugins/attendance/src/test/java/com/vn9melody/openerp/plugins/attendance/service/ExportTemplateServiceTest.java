package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class ExportTemplateServiceTest {

    private ExportTemplateService service;
    private TestDataClient client;

    static class TestDataClient extends PluginDataClient {
        final List<Map<String, Object>> templates = new ArrayList<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            if ("attendance.export_template.list".equals(queryId)) {
                return new PluginQueryResult(templates, templates.size(), 0);
            }
            if ("attendance.export_template.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : templates) {
                    if (id.equals(r.get("id"))) {
                        return new PluginQueryResult(List.of(r), 1, 0);
                    }
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            return new PluginQueryResult(List.of(), 0, 0);
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            if ("attendance.export_template.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                row.put("created_at", Instant.now().toString());
                row.put("updated_at", Instant.now().toString());
                templates.add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.export_template.update".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : templates) {
                    if (id.equals(r.get("id"))) {
                        if (params.containsKey("name")) r.put("name", params.get("name"));
                        if (params.containsKey("columns")) r.put("columns", params.get("columns"));
                        if (params.containsKey("is_default")) r.put("is_default", params.get("is_default"));
                        r.put("updated_at", Instant.now().toString());
                    }
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.export_template.delete".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                templates.removeIf(r -> id.equals(r.get("id")));
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            return new PluginQueryResult(List.of(), 0, 0);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        client = new TestDataClient();
        service = new ExportTemplateService();
        Field cf = service.getClass().getDeclaredField("client");
        cf.setAccessible(true);
        cf.set(service, client);

        Field of = service.getClass().getDeclaredField("objectMapper");
        of.setAccessible(true);
        of.set(service, new ObjectMapper());
    }

    @Test
    @DisplayName("Create template: column whitelist validation")
    void testColumnWhitelist() {
        // Unknown column throws 400
        ExportTemplateCreateRequest badReq = new ExportTemplateCreateRequest(
                "Mẫu sai",
                List.of(new ExportTemplateColumn("UNKNOWN_COL", "Lạ lùng", 1, true)),
                false
        );
        ApiException ex = assertThrows(ApiException.class, () -> service.createTemplate(badReq));
        assertEquals(400, ex.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_EXPORT_COLUMN_UNKNOWN, ex.getCode());

        // Valid columns succeed
        ExportTemplateCreateRequest goodReq = new ExportTemplateCreateRequest(
                "Mẫu chuẩn VN",
                List.of(
                        new ExportTemplateColumn("EMPLOYEE_CODE", "Mã NV", 1, true),
                        new ExportTemplateColumn("FULL_NAME", "Họ Tên", 2, true),
                        new ExportTemplateColumn("ACTUAL_DAYS", "Công", 3, true)
                ),
                true
        );
        ExportTemplateDto created = service.createTemplate(goodReq);
        assertNotNull(created);
        assertEquals("Mẫu chuẩn VN", created.name());
        assertEquals(3, created.columns().size());
        assertTrue(created.isDefault());
    }

    @Test
    @DisplayName("Template CRUD: list, get, update, delete")
    void testTemplateCrud() {
        ExportTemplateCreateRequest req = new ExportTemplateCreateRequest(
                "Template A",
                List.of(new ExportTemplateColumn("EMPLOYEE_CODE", "Mã NV", 1, true)),
                false
        );
        ExportTemplateDto created = service.createTemplate(req);

        ExportTemplateDto fetched = service.getTemplate(created.id());
        assertEquals("Template A", fetched.name());

        ExportTemplateDto updated = service.updateTemplate(created.id(), new ExportTemplateUpdateRequest(
                "Template A Updated", null, true
        ));
        assertEquals("Template A Updated", updated.name());
        assertTrue(updated.isDefault());

        service.deleteTemplate(created.id());
        assertTrue(service.listTemplates().isEmpty());
    }
}
