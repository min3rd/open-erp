package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import com.vn9melody.openerp.plugins.attendance.model.LogSource;
import com.vn9melody.openerp.plugins.attendance.service.AttendanceLogService;
import com.vn9melody.openerp.plugins.attendance.service.KioskSecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class KioskResourceTest {

    private KioskResource resource;
    private KioskSecurityService securityService;
    private AttendanceLogService mockLogService;
    private TestDataClient testDataClient;
    private UUID deviceId;
    private UUID employeeId;
    private String rawPin;
    private String hashedPin;

    static class StubLogService extends AttendanceLogService {
        @Override
        public CheckInResponse checkIn(UUID empId, CheckInRequest req, LogSource source, Map<String, Object> meta, com.vn9melody.openerp.plugins.attendance.model.AttendanceModels.BranchLocation loc) {
            return new CheckInResponse(UUID.randomUUID(), empId, LocalDate.now(), "STANDARD", "Ca chuẩn", Instant.now(), false, LogSource.KIOSK);
        }

        @Override
        public CheckOutResponse checkOut(UUID empId, LogSource source, Map<String, Object> meta) {
            return new CheckOutResponse(UUID.randomUUID(), empId, LocalDate.now(), Instant.now(), LogSource.KIOSK);
        }
    }

    static class TestDataClient extends PluginDataClient {
        final Map<String, List<Map<String, Object>>> queryResponses = new HashMap<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            List<Map<String, Object>> rows = queryResponses.getOrDefault(queryId, List.of());
            return new PluginQueryResult(rows, rows.size(), 0);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        resource = new KioskResource();
        securityService = new KioskSecurityService();
        mockLogService = new StubLogService();
        testDataClient = new TestDataClient();

        deviceId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        rawPin = "123456";
        hashedPin = securityService.hashPin(rawPin);

        Field secField = KioskResource.class.getDeclaredField("securityService");
        secField.setAccessible(true);
        secField.set(resource, securityService);

        Field logField = KioskResource.class.getDeclaredField("logService");
        logField.setAccessible(true);
        logField.set(resource, mockLogService);

        Field clientField = KioskResource.class.getDeclaredField("client");
        clientField.setAccessible(true);
        clientField.set(resource, testDataClient);

        // Setup mock device response
        Map<String, Object> deviceRow = new HashMap<>();
        deviceRow.put("id", deviceId.toString());
        deviceRow.put("name", "Kiosk T1");
        deviceRow.put("device_type", "KIOSK");
        deviceRow.put("device_code", "KIOSK_T1");
        deviceRow.put("pin_hash", hashedPin);
        deviceRow.put("is_active", true);

        testDataClient.queryResponses.put("attendance.device.get_by_code", List.of(deviceRow));

        // Setup mock employee response
        Map<String, Object> empRow = new HashMap<>();
        empRow.put("employee_id", employeeId.toString());
        empRow.put("employee_code", "EMP001");
        empRow.put("full_name", "Nguyen Van A");

        testDataClient.queryResponses.put("attendance.employee_ref.get_by_code", List.of(empRow));
    }

    @Test
    @DisplayName("Kiosk authenticate with valid PIN succeeds and returns token")
    void authenticateSuccess() {
        KioskAuthRequest req = new KioskAuthRequest("EMP001", rawPin);
        ApiResponse<KioskAuthResponse> resp = resource.authenticate("KIOSK_T1", req);

        assertTrue(resp.isSuccess());
        assertEquals(AttendanceErrorCode.KIOSK_AUTH_SUCCESS, resp.getCode());
        assertNotNull(resp.getData());
        assertNotNull(resp.getData().sessionToken());
        assertEquals("EMP001", resp.getData().employeeCode());
    }

    @Test
    @DisplayName("Kiosk authenticate with invalid PIN throws KIOSK_AUTH_FAILED")
    void authenticateInvalidPin() {
        KioskAuthRequest req = new KioskAuthRequest("EMP001", "wrong");
        ApiException ex = assertThrows(ApiException.class, () ->
                resource.authenticate("KIOSK_T1", req)
        );
        assertEquals(AttendanceErrorCode.KIOSK_AUTH_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Kiosk punch with valid session token succeeds")
    void punchSuccess() {
        // Authenticate first
        ApiResponse<KioskAuthResponse> authResp = resource.authenticate("KIOSK_T1", new KioskAuthRequest("EMP001", rawPin));
        String token = authResp.getData().sessionToken();

        // Punch IN
        KioskPunchRequest punchReq = new KioskPunchRequest("EMP001", LogEventType.IN);
        ApiResponse<KioskPunchResponse> punchResp = resource.punch("KIOSK_T1", token, punchReq);

        assertTrue(punchResp.isSuccess());
        assertEquals(AttendanceErrorCode.KIOSK_PUNCH_SUCCESS, punchResp.getCode());
        assertEquals(LogEventType.IN, punchResp.getData().eventType());
    }

    @Test
    @DisplayName("Kiosk punch with expired/consumed session token throws KIOSK_SESSION_EXPIRED")
    void punchConsumedTokenThrows() {
        ApiResponse<KioskAuthResponse> authResp = resource.authenticate("KIOSK_T1", new KioskAuthRequest("EMP001", rawPin));
        String token = authResp.getData().sessionToken();

        // First punch consumes token
        resource.punch("KIOSK_T1", token, new KioskPunchRequest("EMP001", LogEventType.IN));

        // Second punch with same token fails
        ApiException ex = assertThrows(ApiException.class, () ->
                resource.punch("KIOSK_T1", token, new KioskPunchRequest("EMP001", LogEventType.OUT))
        );
        assertEquals(AttendanceErrorCode.KIOSK_SESSION_EXPIRED, ex.getErrorCode());
    }
}

