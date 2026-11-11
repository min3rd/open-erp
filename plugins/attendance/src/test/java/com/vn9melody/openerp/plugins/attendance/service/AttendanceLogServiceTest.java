package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceModels.BranchLocation;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import com.vn9melody.openerp.plugins.attendance.model.LogSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AttendanceLogServiceTest {

    private AttendanceLogService service;
    private TestPluginDataClient testDataClient;
    private UUID employeeId;
    private BranchLocation hcmcBranch;

    static class TestPluginDataClient extends PluginDataClient {
        final List<Map<String, ?>> writeCalls = new ArrayList<>();
        final Map<String, List<Map<String, Object>>> queryResponses = new HashMap<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            List<Map<String, Object>> rows = queryResponses.getOrDefault(queryId, List.of());
            return new PluginQueryResult(rows, rows.size(), 0);
        }

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            writeCalls.add(params != null ? new HashMap<>(params) : Map.of());
            UUID id = UUID.randomUUID();
            return new PluginQueryResult(List.of(Map.of("id", id.toString())), 1, 1);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        service = new AttendanceLogService();
        testDataClient = new TestPluginDataClient();
        employeeId = UUID.randomUUID();

        // Inject test client and object mapper via reflection
        Field clientField = AttendanceLogService.class.getDeclaredField("client");
        clientField.setAccessible(true);
        clientField.set(service, testDataClient);

        Field mapperField = AttendanceLogService.class.getDeclaredField("objectMapper");
        mapperField.setAccessible(true);
        mapperField.set(service, new ObjectMapper());

        // Bitexco branch coordinates
        hcmcBranch = new BranchLocation(UUID.randomUUID(), "Chi nhánh HCM", 10.7716, 106.7044, 200);
    }

    @Test
    @DisplayName("Normal Web check-in succeeds")
    void normalWebCheckIn() {
        CheckInResponse response = service.checkIn(employeeId, new CheckInRequest(null), LogSource.WEB, null, null);

        assertNotNull(response);
        assertEquals(employeeId, response.employeeId());
        assertEquals(LogSource.WEB, response.source());
        assertFalse(response.geofenceFlag());
        assertFalse(testDataClient.writeCalls.isEmpty());
        assertEquals(LogEventType.IN.name(), testDataClient.writeCalls.get(0).get("event_type"));
    }

    @Test
    @DisplayName("Double check-in without check-out throws ATTENDANCE_ALREADY_CHECKED_IN")
    void doubleCheckInRejection() {
        // Mock existing open IN log
        Map<String, Object> openLog = new HashMap<>();
        openLog.put("id", UUID.randomUUID().toString());
        openLog.put("employee_id", employeeId.toString());
        openLog.put("event_type", LogEventType.IN.name());
        openLog.put("occurred_at", Instant.now().minusSeconds(3600).toString());
        openLog.put("work_date", LocalDate.now().toString());
        openLog.put("source", LogSource.WEB.name());

        testDataClient.queryResponses.put("attendance.log.list_by_employee", List.of(openLog));

        ApiException ex = assertThrows(ApiException.class, () ->
                service.checkIn(employeeId, new CheckInRequest(null), LogSource.WEB, null, null)
        );
        assertEquals(AttendanceErrorCode.ATTENDANCE_ALREADY_CHECKED_IN, ex.getErrorCode());
        assertEquals(409, ex.getStatusCode());
    }

    @Test
    @DisplayName("Check-out without open check-in throws ATTENDANCE_NO_OPEN_CHECKIN")
    void checkOutWithoutOpenCheckInThrows() {
        // No logs existing
        ApiException ex = assertThrows(ApiException.class, () ->
                service.checkOut(employeeId, LogSource.WEB, null)
        );
        assertEquals(AttendanceErrorCode.ATTENDANCE_NO_OPEN_CHECKIN, ex.getErrorCode());
        assertEquals(400, ex.getStatusCode());
    }

    @Test
    @DisplayName("Normal check-out succeeds after open check-in")
    void normalCheckOutSucceeds() {
        // Mock existing open IN log
        Map<String, Object> openLog = new HashMap<>();
        openLog.put("id", UUID.randomUUID().toString());
        openLog.put("employee_id", employeeId.toString());
        openLog.put("event_type", LogEventType.IN.name());
        openLog.put("occurred_at", Instant.now().minusSeconds(3600).toString());
        openLog.put("work_date", LocalDate.now().toString());
        openLog.put("source", LogSource.WEB.name());

        testDataClient.queryResponses.put("attendance.log.list_by_employee", List.of(openLog));

        CheckOutResponse response = service.checkOut(employeeId, LogSource.WEB, null);
        assertNotNull(response);
        assertEquals(employeeId, response.employeeId());
        assertEquals(LogSource.WEB, response.source());
    }

    @Test
    @DisplayName("Mobile check-in within radius has geofenceFlag = false")
    void mobileCheckInWithinRadius() {
        // Point 50m away from Bitexco
        GpsCoordinates nearGps = new GpsCoordinates(10.7719, 106.7044);
        CheckInResponse response = service.checkIn(
                employeeId, new CheckInRequest(nearGps), LogSource.MOBILE, null, hcmcBranch
        );

        assertNotNull(response);
        assertFalse(response.geofenceFlag());
    }

    @Test
    @DisplayName("Mobile check-in outside radius sets geofenceFlag = true and warning in meta")
    void mobileCheckInOutsideRadiusSetsWarning() {
        // Landmark 81 is 3.2km away (> 200m)
        GpsCoordinates farGps = new GpsCoordinates(10.7950, 106.7219);
        CheckInResponse response = service.checkIn(
                employeeId, new CheckInRequest(farGps), LogSource.MOBILE, null, hcmcBranch
        );

        assertNotNull(response);
        assertTrue(response.geofenceFlag(), "Should have geofence warning flag");

        // Verify meta has geofence_warning
        assertFalse(testDataClient.writeCalls.isEmpty());
        String metaJson = (String) testDataClient.writeCalls.get(0).get("meta");
        assertTrue(metaJson.contains("geofence_warning"));
    }

    @Test
    @DisplayName("On-behalf check-in requires reason and sets MANUAL source")
    void onBehalfCheckIn() {
        UUID hrUserId = UUID.randomUUID();
        OnBehalfLogRequest request = new OnBehalfLogRequest(
                employeeId, LogEventType.IN, Instant.now(), "Nhân viên quên chấm công vào ca"
        );

        LogDto result = service.onBehalf(hrUserId, request);
        assertNotNull(result);
        assertEquals(LogSource.MANUAL, result.source());

        assertFalse(testDataClient.writeCalls.isEmpty());
        assertEquals(LogSource.MANUAL.name(), testDataClient.writeCalls.get(0).get("source"));
    }

    @Test
    @DisplayName("On-behalf check-in without reason throws ATTENDANCE_LOG_DELETE_REASON_REQUIRED")
    void onBehalfWithoutReasonThrows() {
        OnBehalfLogRequest request = new OnBehalfLogRequest(
                employeeId, LogEventType.IN, Instant.now(), ""
        );
        ApiException ex = assertThrows(ApiException.class, () ->
                service.onBehalf(UUID.randomUUID(), request)
        );
        assertEquals(AttendanceErrorCode.ATTENDANCE_LOG_DELETE_REASON_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Delete log requires reason and soft deletes")
    void deleteLogRequiresReason() {
        UUID logId = UUID.randomUUID();
        UUID hrUserId = UUID.randomUUID();

        // Without reason throws
        ApiException ex = assertThrows(ApiException.class, () ->
                service.deleteLog(logId, hrUserId, "  ")
        );
        assertEquals(AttendanceErrorCode.ATTENDANCE_LOG_DELETE_REASON_REQUIRED, ex.getErrorCode());

        // With reason soft deletes
        service.deleteLog(logId, hrUserId, "Chấm nhầm ca");
        assertFalse(testDataClient.writeCalls.isEmpty());
        assertEquals("Chấm nhầm ca", testDataClient.writeCalls.get(0).get("deleted_reason"));
    }

    @Test
    @DisplayName("CSV import processes BioTime logs and inserts valid entries")
    void importBioTimeCsv() {
        // Mock employee ref query
        testDataClient.queryResponses.put("attendance.employee_ref.get_by_code",
                List.of(Map.of("employee_id", employeeId.toString())));

        String csv = """
                EmployeeCode,DateTime,PunchState,DeviceName
                EMP001,2026-11-02 08:00:00,0,GATE_1
                EMP001,2026-11-02 17:30:00,1,GATE_1
                """;

        ImportResult result = service.importLogs(csv, UUID.randomUUID());
        assertEquals(2, result.total());
        assertEquals(2, result.inserted());
        assertEquals(0, result.skipped());
    }

    @Test
    @DisplayName("Hardware push ingestion processes events")
    void pushIngest() {
        testDataClient.queryResponses.put("attendance.employee_ref.get_by_code",
                List.of(Map.of("employee_id", employeeId.toString())));

        UUID deviceId = UUID.randomUUID();
        PushEvent ev = new PushEvent("EMP001", LogEventType.IN, Instant.now(), Map.of("temperature", 36.5));
        PushIngestRequest request = new PushIngestRequest(List.of(ev));

        PushIngestResponse response = service.ingestPush(deviceId, request);
        assertEquals(1, response.inserted());
        assertEquals(0, response.skipped());
    }
}

