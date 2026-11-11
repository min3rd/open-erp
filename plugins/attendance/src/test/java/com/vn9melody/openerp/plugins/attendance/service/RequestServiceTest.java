package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.LeaveBalanceDto;
import com.vn9melody.openerp.plugins.attendance.dto.LeaveDtos.LeaveTypeDto;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.MappingStatus;
import com.vn9melody.openerp.plugins.attendance.model.RequestStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class RequestServiceTest {

    private RequestService requestService;
    private RequestTypeService requestTypeService;
    private LeaveLedgerService leaveLedgerService;
    private RequestMappingExecutor mappingExecutor;
    private TestDataClient client;
    private UUID currentUserId;

    static class TestDataClient extends PluginDataClient {
        final List<Map<String, Object>> types = new ArrayList<>();
        final List<Map<String, Object>> requests = new ArrayList<>();
        final List<Map<String, Object>> timesheets = new ArrayList<>();
        final List<Map<String, Object>> ledger = new ArrayList<>();
        final List<Map<String, Object>> leaveTypes = new ArrayList<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            if ("attendance.request_type.list".equals(queryId)) return new PluginQueryResult(types, types.size(), 0);
            if ("attendance.request_type.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : types) if (id.equals(r.get("id"))) return new PluginQueryResult(List.of(r), 1, 0);
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.request_type.get_by_code".equals(queryId)) {
                String code = (String) params.get("code");
                for (Map<String, Object> r : types) if (code.equalsIgnoreCase((String) r.get("code"))) return new PluginQueryResult(List.of(r), 1, 0);
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.request.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : requests) if (id.equals(r.get("id"))) return new PluginQueryResult(List.of(r), 1, 0);
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.request.list".equals(queryId)) {
                return new PluginQueryResult(requests, requests.size(), 0);
            }
            if ("attendance.timesheet.get_by_period".equals(queryId)) {
                int y = (int) params.get("period_year");
                int m = (int) params.get("period_month");
                for (Map<String, Object> r : timesheets) {
                    if (Objects.equals(y, r.get("period_year")) && Objects.equals(m, r.get("period_month"))) {
                        return new PluginQueryResult(List.of(r), 1, 0);
                    }
                }
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.leave_type.get_by_id".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : leaveTypes) if (id.equals(r.get("id"))) return new PluginQueryResult(List.of(r), 1, 0);
                return new PluginQueryResult(List.of(), 0, 0);
            }
            if ("attendance.leave_type.list".equals(queryId)) {
                return new PluginQueryResult(leaveTypes, leaveTypes.size(), 0);
            }
            if ("attendance.leave_ledger.list".equals(queryId)) {
                return new PluginQueryResult(ledger, ledger.size(), 0);
            }
            return new PluginQueryResult(List.of(), 0, 0);
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            if ("attendance.request_type.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                types.add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.request.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                row.put("created_at", Instant.now().toString());
                row.put("updated_at", Instant.now().toString());
                requests.add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.request.update_status".equals(queryId)) {
                UUID id = (UUID) params.get("id");
                for (Map<String, Object> r : requests) {
                    if (id.equals(r.get("id"))) r.putAll(params);
                }
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            if ("attendance.leave_ledger.insert".equals(queryId)) {
                UUID id = UUID.randomUUID();
                Map<String, Object> row = new LinkedHashMap<>(params);
                row.put("id", id);
                ledger.add(row);
                return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
            }
            return new PluginQueryResult(List.of(Map.of("id", UUID.randomUUID().toString())), 1, 1);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        client = new TestDataClient();
        currentUserId = UUID.randomUUID();
        ObjectMapper objectMapper = new ObjectMapper();

        requestTypeService = new RequestTypeService();
        setField(requestTypeService, "client", client);
        setField(requestTypeService, "objectMapper", objectMapper);

        leaveLedgerService = new LeaveLedgerService();
        setField(leaveLedgerService, "client", client);

        mappingExecutor = new RequestMappingExecutor();
        setField(mappingExecutor, "client", client);
        setField(mappingExecutor, "leaveLedgerService", leaveLedgerService);

        requestService = new RequestService();
        setField(requestService, "client", client);
        setField(requestService, "requestTypeService", requestTypeService);
        setField(requestService, "leaveLedgerService", leaveLedgerService);
        setField(requestService, "mappingExecutor", mappingExecutor);
        setField(requestService, "objectMapper", objectMapper);
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }

    @Test
    @DisplayName("Submit request happy path and window days validation")
    void testSubmitRequest() {
        RequestSubmitRequest req = new RequestSubmitRequest(
                "ATTENDANCE_FIX",
                Map.of("work_date", LocalDate.now().toString(), "event_type", "IN"),
                Map.of("work_date", LocalDate.now().toString())
        );

        RequestDto submitted = requestService.submitRequest(currentUserId, currentUserId, req);
        assertNotNull(submitted);
        assertEquals(RequestStatus.PENDING, submitted.status());
        assertTrue(submitted.code().startsWith("REQ-"));

        // Window days exceeded: ATTENDANCE_FIX window is 7 days, request date 10 days ago throws 400
        RequestSubmitRequest oldReq = new RequestSubmitRequest(
                "ATTENDANCE_FIX",
                Map.of("work_date", LocalDate.now().minusDays(10).toString()),
                Map.of("work_date", LocalDate.now().minusDays(10).toString())
        );
        ApiException ex = assertThrows(ApiException.class, () -> requestService.submitRequest(currentUserId, currentUserId, oldReq));
        assertEquals(400, ex.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_REQUEST_WINDOW_EXCEEDED, ex.getCode());
    }

    @Test
    @DisplayName("Submit request when timesheet period is locked throws 400")
    void testPeriodLocked() {
        LocalDate now = LocalDate.now();
        client.timesheets.add(Map.of(
                "period_year", now.getYear(),
                "period_month", now.getMonthValue(),
                "locked_at", Instant.now().toString()
        ));

        RequestSubmitRequest req = new RequestSubmitRequest(
                "OVERTIME",
                Map.of("work_date", now.toString()),
                Map.of("work_date", now.toString())
        );

        ApiException ex = assertThrows(ApiException.class, () -> requestService.submitRequest(currentUserId, currentUserId, req));
        assertEquals(400, ex.getStatusCode());
        assertEquals(AttendanceErrorCode.ATTENDANCE_PERIOD_LOCKED, ex.getCode());
    }

    @Test
    @DisplayName("Fallback action APPROVE triggers mapping")
    void testFallbackAction() {
        RequestSubmitRequest req = new RequestSubmitRequest(
                "OVERTIME",
                Map.of("work_date", LocalDate.now().toString()),
                Map.of("work_date", LocalDate.now().toString())
        );
        RequestDto submitted = requestService.submitRequest(currentUserId, currentUserId, req);
        assertEquals(RequestStatus.PENDING, submitted.status());

        // Approve
        RequestDto approved = requestService.fallbackAction(submitted.id(), currentUserId,
                new FallbackActionRequest(RequestStatus.APPROVED, "Đồng ý OT"));
        assertEquals(RequestStatus.APPROVED, approved.status());
        assertEquals(MappingStatus.APPLIED, approved.mappingStatus());
    }

    @Test
    @DisplayName("Event Hub consume workflow.instance.completed event triggers mapping")
    void testWorkflowCompletedEvent() {
        RequestSubmitRequest req = new RequestSubmitRequest(
                "BUSINESS_TRIP",
                Map.of("start_date", LocalDate.now().toString(), "end_date", LocalDate.now().toString()),
                Map.of("start_date", LocalDate.now().toString())
        );
        RequestDto submitted = requestService.submitRequest(currentUserId, currentUserId, req);

        // Workflow completed event
        requestService.handleWorkflowCompletedEvent(submitted.id(), "APPROVED", "Approved by CEO");

        RequestDto updated = requestService.getRequest(submitted.id());
        assertEquals(RequestStatus.APPROVED, updated.status());
        assertEquals(MappingStatus.APPLIED, updated.mappingStatus());
    }
}

