package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class RequestTypeServiceTest {

    private RequestTypeService service;
    private TestDataClient client;

    static class TestDataClient extends PluginDataClient {
        final List<Map<String, Object>> types = new ArrayList<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            if ("attendance.request_type.list".equals(queryId)) {
                return new PluginQueryResult(types, types.size(), 0);
            }
            if ("attendance.request_type.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : types) {
                    if (id.equals(r.get("id"))) return new PluginQueryResult(List.of(r), 1, 0);
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.request_type.get_by_code".equals(queryId)) {
                String code = (String) params.get("code");
                for (Map<String, Object> r : types) {
                    if (code.equalsIgnoreCase((String) r.get("code"))) return new PluginQueryResult(List.of(r), 1, 0);
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            return new PluginQueryResult(List.of(), 0, 0);
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            if ("attendance.request_type.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                row.put("created_at", Instant.now().toString());
                row.put("updated_at", Instant.now().toString());
                types.add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.request_type.update".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : types) {
                    if (id.equals(r.get("id"))) r.putAll(params);
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.request_type.delete".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                types.removeIf(r -> id.equals(r.get("id")));
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            return new PluginQueryResult(List.of(), 0, 0);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        client = new TestDataClient();
        service = new RequestTypeService();
        Field cf = service.getClass().getDeclaredField("client");
        cf.setAccessible(true);
        cf.set(service, client);

        Field of = service.getClass().getDeclaredField("objectMapper");
        of.setAccessible(true);
        of.set(service, new ObjectMapper());
    }

    @Test
    @DisplayName("Seed 6 system request types and check immutability")
    void testSeedAndImmutability() {
        List<RequestTypeDto> all = service.listRequestTypes(false);
        assertEquals(6, all.size());

        RequestTypeDto leave = service.getRequestTypeByCode("LEAVE");
        assertTrue(leave.isSystem());
        assertEquals("Nghỉ phép", leave.name());

        // Deleting system type throws 400
        ApiException ex = assertThrows(ApiException.class, () -> service.deleteRequestType(leave.id()));
        assertEquals(400, ex.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_REQUEST_TYPE_IMMUTABLE, ex.getCode());
    }

    @Test
    @DisplayName("Create custom request type with X_ prefix")
    void testCustomRequestType() {
        RequestTypeCreateRequest custom = new RequestTypeCreateRequest(
                "WFH_COVID", "Xin làm việc từ xa vì dịch", null, "wf-custom", 10, 100
        );
        RequestTypeDto created = service.createCustomType(custom);
        assertNotNull(created);
        assertEquals("X_WFH_COVID", created.code());
        assertFalse(created.isSystem());

        // Custom type can be deleted
        service.deleteRequestType(created.id());
        ApiException ex = assertThrows(ApiException.class, () -> service.getRequestType(created.id()));
        assertEquals(404, ex.getStatusCode());
    }
}

