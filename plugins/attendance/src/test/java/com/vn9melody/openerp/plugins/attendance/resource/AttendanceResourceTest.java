package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.*;
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

class AttendanceResourceTest {

    private AttendanceResource resource;
    private AttendanceLogService mockLogService;
    private TenantContext mockTenantContext;
    private UUID employeeId;

    static class StubLogService extends AttendanceLogService {
        CheckInResponse checkInResponse;
        CheckOutResponse checkOutResponse;
        LogDto lastLogResponse;
        List<LogDto> logsResponse = List.of();

        @Override
        public CheckInResponse checkIn(UUID empId, CheckInRequest req, LogSource source, Map<String, Object> meta, com.vn9melody.openerp.plugins.attendance.model.AttendanceModels.BranchLocation loc) {
            return checkInResponse;
        }

        @Override
        public CheckOutResponse checkOut(UUID empId, LogSource source, Map<String, Object> meta) {
            return checkOutResponse;
        }

        @Override
        public LogDto getLastLog(UUID empId, LocalDate workDate) {
            return lastLogResponse;
        }

        @Override
        public List<LogDto> listEmployeeLogs(UUID empId, LocalDate from, LocalDate to) {
            return logsResponse;
        }
    }

    static class StubTenantContext extends TenantContext {
        UUID stubUserId;

        @Override
        public UUID userId() {
            return stubUserId;
        }
    }

    static class StubDataClient extends PluginDataClient {
        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            return new PluginQueryResult(List.of(), 0, 0);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        resource = new AttendanceResource();
        employeeId = UUID.randomUUID();

        StubLogService stubLogs = new StubLogService();
        stubLogs.checkInResponse = new CheckInResponse(
                UUID.randomUUID(), employeeId, LocalDate.now(), "STANDARD", "Ca chuẩn", Instant.now(), false, LogSource.WEB
        );
        stubLogs.checkOutResponse = new CheckOutResponse(
                UUID.randomUUID(), employeeId, LocalDate.now(), Instant.now(), LogSource.WEB
        );
        mockLogService = stubLogs;

        StubTenantContext stubTenant = new StubTenantContext();
        stubTenant.stubUserId = employeeId;
        mockTenantContext = stubTenant;

        Field logServiceField = AttendanceResource.class.getDeclaredField("logService");
        logServiceField.setAccessible(true);
        logServiceField.set(resource, mockLogService);

        Field tenantContextField = AttendanceResource.class.getDeclaredField("tenantContext");
        tenantContextField.setAccessible(true);
        tenantContextField.set(resource, mockTenantContext);

        Field clientField = AttendanceResource.class.getDeclaredField("client");
        clientField.setAccessible(true);
        clientField.set(resource, new StubDataClient());
    }

    @Test
    @DisplayName("POST /check-in returns 200 with ATTENDANCE_CHECKIN_SUCCESS")
    void checkInReturnsSuccess() {
        ApiResponse<CheckInResponse> resp = resource.checkIn("web", new CheckInRequest(null));

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_CHECKIN_SUCCESS, resp.getCode());
        assertNotNull(resp.getData());
        assertEquals(employeeId, resp.getData().employeeId());
    }

    @Test
    @DisplayName("POST /check-out returns 200 with ATTENDANCE_CHECKOUT_SUCCESS")
    void checkOutReturnsSuccess() {
        ApiResponse<CheckOutResponse> resp = resource.checkOut("web");

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_CHECKOUT_SUCCESS, resp.getCode());
        assertNotNull(resp.getData());
        assertEquals(employeeId, resp.getData().employeeId());
    }

    @Test
    @DisplayName("GET /my-status returns 200 with ATTENDANCE_MY_STATUS_SUCCESS")
    void myStatusReturnsSuccess() {
        ApiResponse<MyStatusResponse> resp = resource.myStatus();

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_MY_STATUS_SUCCESS, resp.getCode());
        assertNotNull(resp.getData());
    }

    @Test
    @DisplayName("GET /my-logs returns 200 with ATTENDANCE_MY_LOGS_SUCCESS")
    void myLogsReturnsSuccess() {
        ApiResponse<PagedData<LogDto>> resp = resource.myLogs(null, null, 1, 50);

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.ATTENDANCE_MY_LOGS_SUCCESS, resp.getCode());
        assertNotNull(resp.getData());
    }
}

