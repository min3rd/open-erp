package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class AttendanceReportServiceTest {

    private AttendanceReportService reportService;
    private TestDataClient client;

    static class TestDataClient extends PluginDataClient {
        final List<Map<String, Object>> records = new ArrayList<>();
        final List<Map<String, Object>> employees = new ArrayList<>();

        @Override
        public PluginQueryResult query(String queryId, Map<String, ?> params, boolean primary, String idempotencyKey) {
            if ("attendance.record.list_range".equals(queryId)) {
                return new PluginQueryResult(records, records.size(), 0);
            }
            if ("attendance.employee_ref.list_all".equals(queryId)) {
                return new PluginQueryResult(employees, employees.size(), 0);
            }
            return new PluginQueryResult(List.of(), 0, 0);
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        client = new TestDataClient();
        reportService = new AttendanceReportService();
        Field cf = reportService.getClass().getDeclaredField("client");
        cf.setAccessible(true);
        cf.set(reportService, client);
    }

    @Test
    @DisplayName("Summary report computes attendance rate, OT hours, late count, absence count")
    void testSummaryReport() {
        UUID emp1 = UUID.randomUUID();
        UUID emp2 = UUID.randomUUID();

        // 3 records: emp1 PRESENT (ot=60, late=15), emp1 HALF_DAY, emp2 ABSENT
        client.records.add(Map.of("employee_id", emp1, "status", "PRESENT", "ot_minutes", 60, "late_minutes", 15));
        client.records.add(Map.of("employee_id", emp1, "status", "HALF_DAY", "ot_minutes", 0, "late_minutes", 0));
        client.records.add(Map.of("employee_id", emp2, "status", "ABSENT", "ot_minutes", 0, "late_minutes", 0));

        TimesheetSummaryReportDto summary = reportService.getSummaryReport("TENANT", null, LocalDate.now(), LocalDate.now());
        assertNotNull(summary);
        // (1 + 0.5) / 3 = 50%
        assertEquals(50.0, summary.attendanceRate());
        assertEquals(1.0, summary.totalOtHours());
        assertEquals(1, summary.lateCount());
        assertEquals(1, summary.absenceCount());
    }

    @Test
    @DisplayName("Team report, top late and overtime reports")
    void testTeamAndTopReports() {
        UUID emp1 = UUID.randomUUID();
        UUID emp2 = UUID.randomUUID();

        client.employees.add(Map.of("employee_id", emp1.toString(), "employee_code", "NV01", "full_name", "An"));
        client.employees.add(Map.of("employee_id", emp2.toString(), "employee_code", "NV02", "full_name", "Bình"));

        client.records.add(Map.of("employee_id", emp1, "status", "PRESENT", "ot_minutes", 120, "late_minutes", 30));
        client.records.add(Map.of("employee_id", emp2, "status", "PRESENT", "ot_minutes", 60, "late_minutes", 10));

        List<TeamMemberReportDto> team = reportService.getTeamReport(null, null, null);
        assertEquals(2, team.size());

        List<TopLateReportDto> topLate = reportService.getTopLateReport(null, null, 10);
        assertEquals(2, topLate.size());
        assertEquals("NV01", topLate.get(0).employeeCode()); // 30 mins > 10 mins

        List<OvertimeReportDto> topOt = reportService.getOvertimeReport(null, null, 10);
        assertEquals(2, topOt.size());
        assertEquals("NV01", topOt.get(0).employeeCode()); // 120 mins > 60 mins
    }
}

