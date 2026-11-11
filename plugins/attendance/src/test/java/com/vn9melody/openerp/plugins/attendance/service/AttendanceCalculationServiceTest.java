package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.*;
import com.vn9melody.openerp.plugins.attendance.model.ShiftDef;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AttendanceCalculationServiceTest {

    private AttendanceCalculationService service;
    private TestPluginDataClient testDataClient;
    private UUID employeeId;
    private LocalDate workDate;
    private ShiftDef standardShift;

    static class TestPluginDataClient extends PluginDataClient {
        final List<Map<String, ?>> writeCalls = new ArrayList<>();

        @Override
        public PluginQueryResult write(String queryId, Map<String, ?> params) {
            writeCalls.add(params != null ? new HashMap<>(params) : Map.of());
            return new PluginQueryResult(List.of(Map.of("id", UUID.randomUUID().toString())), 1, 1);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        service = new AttendanceCalculationService();
        testDataClient = new TestPluginDataClient();
        employeeId = UUID.randomUUID();
        workDate = LocalDate.of(2026, 11, 2);

        Field clientField = AttendanceCalculationService.class.getDeclaredField("client");
        clientField.setAccessible(true);
        clientField.set(service, testDataClient);

        Field mapperField = AttendanceCalculationService.class.getDeclaredField("objectMapper");
        mapperField.setAccessible(true);
        mapperField.set(service, new ObjectMapper());

        // 08:00 - 17:00, 60m break, 480m working
        standardShift = new ShiftDef(
                "CA_HC", "Ca hành chính",
                LocalTime.of(8, 0), LocalTime.of(17, 0),
                15, 15, 60, 15, 30, 480
        );
    }

    @Test
    @DisplayName("Normal on-time day calculation produces PRESENT")
    void normalOnTimeDay() {
        ShiftResolution shiftRes = new ShiftResolution(standardShift, "TEMPLATE");
        List<LogEntry> logs = List.of(
                new LogEntry(UUID.randomUUID(), LocalDateTime.of(workDate, LocalTime.of(8, 0)), true, "WEB"),
                new LogEntry(UUID.randomUUID(), LocalDateTime.of(workDate, LocalTime.of(17, 0)), false, "WEB")
        );

        CalcResult result = service.calculateDay(
                employeeId, workDate, shiftRes, logs, List.of(), false, null, 16
        );

        assertNotNull(result);
        assertEquals(AttendanceStatus.PRESENT, result.status());
        assertEquals(480, result.workedMinutes());
        assertEquals(0, result.lateMinutes());
        assertEquals(0, result.earlyLeaveMinutes());
        assertFalse(result.needsReview());

        assertFalse(testDataClient.writeCalls.isEmpty());
        assertEquals(AttendanceStatus.PRESENT.name(), testDataClient.writeCalls.get(0).get("status"));
    }

    @Test
    @DisplayName("Manual override (is_override = true) is preserved and never overwritten (BR-A05)")
    void manualOverrideIsPreserved() {
        ShiftResolution shiftRes = new ShiftResolution(standardShift, "TEMPLATE");
        List<LogEntry> logs = List.of(
                new LogEntry(UUID.randomUUID(), LocalDateTime.of(workDate, LocalTime.of(8, 0)), true, "WEB"),
                new LogEntry(UUID.randomUUID(), LocalDateTime.of(workDate, LocalTime.of(17, 0)), false, "WEB")
        );

        // Pre-existing override: marked as WFH by HR
        Map<String, Object> overrideRecord = new HashMap<>();
        overrideRecord.put("is_override", true);
        overrideRecord.put("status", AttendanceStatus.WFH.name());
        overrideRecord.put("worked_minutes", 480);
        overrideRecord.put("late_minutes", 0);
        overrideRecord.put("early_leave_minutes", 0);
        overrideRecord.put("ot_minutes", 0);
        overrideRecord.put("override_reason", "HR phê duyệt làm việc tại nhà");

        CalcResult result = service.calculateDay(
                employeeId, workDate, shiftRes, logs, List.of(), false, overrideRecord, 16
        );

        assertNotNull(result);
        // Status remains WFH despite logs
        assertEquals(AttendanceStatus.WFH, result.status());
        // No writes should have overwritten the calculation
        assertTrue(testDataClient.writeCalls.isEmpty());
    }

    @Test
    @DisplayName("Hanging check-in (> 16h without OUT) marks needs_review and publishes outbox")
    void hangingCheckInMarksReview() {
        ShiftResolution shiftRes = new ShiftResolution(standardShift, "TEMPLATE");
        // Punch occurred 20 hours ago
        LocalDateTime pastIn = LocalDateTime.now().minusHours(20);
        List<LogEntry> logs = List.of(
                new LogEntry(UUID.randomUUID(), pastIn, true, "WEB")
        );

        CalcResult result = service.calculateDay(
                employeeId, workDate, shiftRes, logs, List.of(), false, null, 16
        );

        assertTrue(result.needsReview(), "Hanging punch must flag needs_review");
        assertEquals("HANGING_CHECK_IN", result.reviewNote());

        // Verify outbox published
        boolean outboxFound = testDataClient.writeCalls.stream()
                .anyMatch(call -> "attendance.record.needs_review".equals(call.get("event_type")));
        assertTrue(outboxFound, "Should publish attendance.record.needs_review event");
    }

    @Test
    @DisplayName("Approved overtime within OT window is credited")
    void approvedOvertimeWindowCredited() {
        ShiftResolution shiftRes = new ShiftResolution(standardShift, "TEMPLATE");
        // Checked in 08:00, checked out 19:30 (2h30 after shift)
        List<LogEntry> logs = List.of(
                new LogEntry(UUID.randomUUID(), LocalDateTime.of(workDate, LocalTime.of(8, 0)), true, "WEB"),
                new LogEntry(UUID.randomUUID(), LocalDateTime.of(workDate, LocalTime.of(19, 30)), false, "WEB")
        );
        // Approved OT window 17:30 - 19:30 (2 hours)
        List<OtWindow> otWindows = List.of(
                new OtWindow(LocalDateTime.of(workDate, LocalTime.of(17, 30)),
                        LocalDateTime.of(workDate, LocalTime.of(19, 30)))
        );

        CalcResult result = service.calculateDay(
                employeeId, workDate, shiftRes, logs, otWindows, false, null, 16
        );

        assertEquals(AttendanceStatus.PRESENT, result.status());
        assertTrue(result.otMinutes() > 0, "Approved OT should be calculated");
    }
}
