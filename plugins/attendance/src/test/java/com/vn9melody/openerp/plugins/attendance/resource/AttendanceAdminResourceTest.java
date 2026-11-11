package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import com.vn9melody.openerp.plugins.attendance.model.LogSource;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AttendanceAdminResourceTest {

    private AttendanceAdminResource resource;
    private StubLogService mockLogService;
    private StubTenantContext mockTenantContext;
    private TestDataClient testDataClient;
    private UUID hrUserId;

    static class StubLogService extends AttendanceLogService {
        ImportResult importResult = new ImportResult(10, 8, 2, List.of());
        LogDto onBehalfDto;

        @Override
        public void deleteLog(UUID logId, UUID deletedBy, String reason) {
            if (reason == null || reason.isBlank()) {
                throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_LOG_DELETE_REASON_REQUIRED, "Reason required", Map.of());
            }
        }

        @Override
        public LogDto onBehalf(UUID enteredBy, OnBehalfLogRequest req) {
            return onBehalfDto;
        }

        @Override
        public ImportResult importLogs(String csv, UUID userId) {
            return importResult;
        }
    }

    static class StubTenantContext extends TenantContext {
        UUID stubUserId;

        @Override
        public UUID userId() {
            return stubUserId;
        }
    }

    static class TestDataClient extends PluginDataClient {
        final Map<String, List<Map<String, Object>>> queryResponses = new HashMap<>();
        final List<Map<String, ?>> writeCalls = new ArrayList<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            List<Map<String, Object>> rows = queryResponses.getOrDefault(queryId, List.of());
            return new PluginQueryResult(rows, rows.size(), 0);
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            writeCalls.add(params != null ? new HashMap<>(params) : Map.of());
            return new PluginQueryResult(List.of(Map.of("id", UUID.randomUUID().toString())), 1, 1);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        resource = new AttendanceAdminResource();
        hrUserId = UUID.randomUUID();

        mockLogService = new StubLogService();
        mockLogService.onBehalfDto = new LogDto(
                UUID.randomUUID(), UUID.randomUUID(), "EMP001", "Nguyen Van A",
                LogEventType.IN, Instant.now(), LocalDate.now(), LogSource.MANUAL,
                null, Map.of(), null, null, null, Instant.now()
        );

        mockTenantContext = new StubTenantContext();
        mockTenantContext.stubUserId = hrUserId;

        testDataClient = new TestDataClient();

        Field logField = AttendanceAdminResource.class.getDeclaredField("logService");
        logField.setAccessible(true);
        logField.set(resource, mockLogService);

        Field tenantField = AttendanceAdminResource.class.getDeclaredField("tenantContext");
        tenantField.setAccessible(true);
        tenantField.set(resource, mockTenantContext);

        Field clientField = AttendanceAdminResource.class.getDeclaredField("client");
        clientField.setAccessible(true);
        clientField.set(resource, testDataClient);
    }

    @Test
    @DisplayName("GET /admin/logs returns 200 with ATTENDANCE_LOG_LIST_SUCCESS")
    void listLogsSucceeds() {
        Map<String, Object> row = new HashMap<>();
        row.put("id", UUID.randomUUID().toString());
        row.put("employee_id", UUID.randomUUID().toString());
        row.put("event_type", "IN");
        row.put("occurred_at", Instant.now().toString());
        row.put("work_date", LocalDate.now().toString());
        row.put("source", "WEB");
        testDataClient.queryResponses.put("attendance.log.list", List.of(row));

        ApiResponse<PagedData<LogDto>> resp = resource.listLogs(null, null, null, null, 1, 50);

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_LOG_LIST_SUCCESS, resp.getCode());
        assertEquals(1, resp.getData().getItems().size());
    }

    @Test
    @DisplayName("DELETE /admin/logs/{id} with reason succeeds")
    void deleteLogWithReasonSucceeds() {
        UUID logId = UUID.randomUUID();
        ApiResponse<Map<String, Object>> resp = resource.deleteLog(logId, new DeleteLogRequest("Chấm sai giờ"));

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_LOG_DELETED, resp.getCode());
    }

    @Test
    @DisplayName("DELETE /admin/logs/{id} without reason throws ATTENDANCE_LOG_DELETE_REASON_REQUIRED")
    void deleteLogWithoutReasonThrows() {
        UUID logId = UUID.randomUUID();
        ApiException ex = assertThrows(ApiException.class, () ->
                resource.deleteLog(logId, new DeleteLogRequest(""))
        );
        assertEquals(AttendanceErrorCode.ATTENDANCE_LOG_DELETE_REASON_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("POST /admin/logs/on-behalf succeeds")
    void onBehalfSucceeds() {
        OnBehalfLogRequest req = new OnBehalfLogRequest(UUID.randomUUID(), LogEventType.IN, Instant.now(), "Quên chấm");
        ApiResponse<LogDto> resp = resource.onBehalf(req);

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_LOG_ON_BEHALF_SUCCESS, resp.getCode());
    }

    @Test
    @DisplayName("POST /admin/logs/import succeeds")
    void importLogsSucceeds() {
        String csv = "EmployeeCode,DateTime,PunchState\nEMP001,2026-11-02 08:00:00,0";
        ApiResponse<ImportResult> resp = resource.importLogs(csv);

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_IMPORT_SUCCESS, resp.getCode());
        assertEquals(10, resp.getData().total());
        assertEquals(8, resp.getData().inserted());
    }

    @Test
    @DisplayName("PUT /admin/records/{id}/override with reason succeeds and sets is_override = true")
    void overrideRecordSucceeds() {
        UUID recordId = UUID.randomUUID();
        RecordOverrideRequest req = new RecordOverrideRequest(
                AttendanceStatus.WFH, Instant.now(), Instant.now(), 480, 0, 0, 0, "Duyệt WFH khẩn"
        );

        ApiResponse<Map<String, Object>> resp = resource.overrideRecord(recordId, req);

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_RECORD_OVERRIDDEN, resp.getCode());
        assertFalse(testDataClient.writeCalls.isEmpty());
        assertTrue(Boolean.TRUE.equals(testDataClient.writeCalls.get(0).get("is_override")));
    }

    @Test
    @DisplayName("PUT /admin/records/{id}/override without reason throws ATTENDANCE_VALIDATION_ERROR")
    void overrideRecordWithoutReasonThrows() {
        UUID recordId = UUID.randomUUID();
        RecordOverrideRequest req = new RecordOverrideRequest(
                AttendanceStatus.WFH, Instant.now(), Instant.now(), 480, 0, 0, 0, ""
        );

        ApiException ex = assertThrows(ApiException.class, () -> resource.overrideRecord(recordId, req));
        assertEquals(AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR, ex.getErrorCode());
    }

    @Test
    @DisplayName("POST /admin/records/recalculate queues recalculation")
    void recalculateQueues() {
        RecalculateRequest req = new RecalculateRequest(List.of(UUID.randomUUID()), LocalDate.now(), LocalDate.now());
        ApiResponse<Map<String, Object>> resp = resource.recalculate(req);

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_RECALC_QUEUED, resp.getCode());
    }
}
