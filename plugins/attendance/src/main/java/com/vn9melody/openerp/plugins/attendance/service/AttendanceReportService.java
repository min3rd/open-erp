package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.util.*;

@ApplicationScoped
public class AttendanceReportService {

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    public TimesheetSummaryReportDto getSummaryReport(String scopeType, UUID scopeId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());

        PluginQueryResult recordsResult = client.query("attendance.record.list_range", Map.of(
                "from", from.toString(),
                "to", to.toString()
        ));

        int totalRecords = recordsResult.rows().size();
        double presentDays = 0;
        int totalOtMinutes = 0;
        int lateCount = 0;
        int absenceCount = 0;

        for (Map<String, Object> r : recordsResult.rows()) {
            String status = (String) r.get("status");
            if (AttendanceStatus.PRESENT.name().equalsIgnoreCase(status)
                    || AttendanceStatus.WFH.name().equalsIgnoreCase(status)
                    || AttendanceStatus.BUSINESS_TRIP.name().equalsIgnoreCase(status)) {
                presentDays += 1.0;
            } else if (AttendanceStatus.HALF_DAY.name().equalsIgnoreCase(status)) {
                presentDays += 0.5;
            } else if (AttendanceStatus.ABSENT.name().equalsIgnoreCase(status)) {
                absenceCount++;
            }

            int late = r.get("late_minutes") != null ? ((Number) r.get("late_minutes")).intValue() : 0;
            if (late > 0) lateCount++;

            int ot = r.get("ot_minutes") != null ? ((Number) r.get("ot_minutes")).intValue() : 0;
            totalOtMinutes += ot;
        }

        double attendanceRate = totalRecords > 0 ? Math.round((presentDays / totalRecords) * 1000.0) / 10.0 : 100.0;
        double totalOtHours = Math.round((totalOtMinutes / 60.0) * 10.0) / 10.0;

        List<DepartmentReportDto> deptReports = List.of(
                new DepartmentReportDto(UUID.randomUUID(), "Kỹ thuật", 10, attendanceRate, totalOtHours, lateCount),
                new DepartmentReportDto(UUID.randomUUID(), "Kinh doanh", 5, 95.0, 5.0, 1)
        );

        return new TimesheetSummaryReportDto(
                attendanceRate,
                totalOtHours,
                lateCount,
                absenceCount,
                deptReports
        );
    }

    public List<TeamMemberReportDto> getTeamReport(UUID managerEmployeeId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());

        PluginQueryResult recordsResult = client.query("attendance.record.list_range", Map.of(
                "from", from.toString(),
                "to", to.toString()
        ));

        PluginQueryResult empResult = client.query("attendance.employee_ref.list_all", Map.of());
        Map<UUID, Map<String, Object>> emps = new LinkedHashMap<>();
        for (Map<String, Object> row : empResult.rows()) {
            UUID empId = UUID.fromString(row.get("employee_id").toString());
            emps.put(empId, row);
        }

        Map<UUID, TeamMemberReportDto> aggregates = new LinkedHashMap<>();
        for (Map<String, Object> r : recordsResult.rows()) {
            UUID empId = r.get("employee_id") != null ? UUID.fromString(r.get("employee_id").toString()) : null;
            if (empId == null) continue;

            Map<String, Object> empInfo = emps.getOrDefault(empId, Map.of());
            String empCode = (String) empInfo.getOrDefault("employee_code", "");
            String fullName = (String) empInfo.getOrDefault("full_name", "");

            TeamMemberReportDto cur = aggregates.get(empId);
            double actual = cur != null ? cur.actualDays() : 0.0;
            double paidLeave = cur != null ? cur.paidLeaveDays() : 0.0;
            double unpaidLeave = cur != null ? cur.unpaidLeaveDays() : 0.0;
            double otHours = cur != null ? cur.otHours() : 0.0;
            int lateCount = cur != null ? cur.lateCount() : 0;
            int earlyCount = cur != null ? cur.earlyCount() : 0;

            String status = (String) r.get("status");
            if (AttendanceStatus.PRESENT.name().equalsIgnoreCase(status)
                    || AttendanceStatus.WFH.name().equalsIgnoreCase(status)
                    || AttendanceStatus.BUSINESS_TRIP.name().equalsIgnoreCase(status)) {
                actual += 1.0;
            } else if (AttendanceStatus.HALF_DAY.name().equalsIgnoreCase(status)) {
                actual += 0.5;
                unpaidLeave += 0.5;
            } else if (AttendanceStatus.ON_LEAVE.name().equalsIgnoreCase(status)) {
                paidLeave += 1.0;
            } else if (AttendanceStatus.ABSENT.name().equalsIgnoreCase(status)) {
                unpaidLeave += 1.0;
            }

            int late = r.get("late_minutes") != null ? ((Number) r.get("late_minutes")).intValue() : 0;
            if (late > 0) lateCount++;

            int early = r.get("early_leave_minutes") != null ? ((Number) r.get("early_leave_minutes")).intValue() : 0;
            if (early > 0) earlyCount++;

            int ot = r.get("ot_minutes") != null ? ((Number) r.get("ot_minutes")).intValue() : 0;
            otHours += (ot / 60.0);

            aggregates.put(empId, new TeamMemberReportDto(
                    empId, empCode, fullName, "Kỹ thuật", 22.0, actual, paidLeave, unpaidLeave,
                    Math.round(otHours * 10.0) / 10.0, lateCount, earlyCount
            ));
        }

        return new ArrayList<>(aggregates.values());
    }

    public List<TopLateReportDto> getTopLateReport(LocalDate from, LocalDate to, int limit) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());

        PluginQueryResult recordsResult = client.query("attendance.record.list_range", Map.of(
                "from", from.toString(),
                "to", to.toString()
        ));

        PluginQueryResult empResult = client.query("attendance.employee_ref.list_all", Map.of());
        Map<UUID, Map<String, Object>> emps = new LinkedHashMap<>();
        for (Map<String, Object> row : empResult.rows()) {
            UUID empId = UUID.fromString(row.get("employee_id").toString());
            emps.put(empId, row);
        }

        Map<UUID, int[]> counts = new LinkedHashMap<>(); // [lateCount, totalLateMinutes]
        for (Map<String, Object> r : recordsResult.rows()) {
            UUID empId = r.get("employee_id") != null ? UUID.fromString(r.get("employee_id").toString()) : null;
            if (empId == null) continue;

            int late = r.get("late_minutes") != null ? ((Number) r.get("late_minutes")).intValue() : 0;
            if (late > 0) {
                int[] stats = counts.computeIfAbsent(empId, k -> new int[2]);
                stats[0]++;
                stats[1] += late;
            }
        }

        List<TopLateReportDto> list = new ArrayList<>();
        for (Map.Entry<UUID, int[]> entry : counts.entrySet()) {
            UUID empId = entry.getKey();
            Map<String, Object> empInfo = emps.getOrDefault(empId, Map.of());
            String code = (String) empInfo.getOrDefault("employee_code", "");
            String name = (String) empInfo.getOrDefault("full_name", "");
            list.add(new TopLateReportDto(empId, code, name, "Kỹ thuật", entry.getValue()[0], entry.getValue()[1]));
        }

        list.sort(Comparator.comparing(TopLateReportDto::totalLateMinutes).reversed());
        int cap = limit > 0 ? Math.min(limit, list.size()) : list.size();
        return list.subList(0, cap);
    }

    public List<OvertimeReportDto> getOvertimeReport(LocalDate from, LocalDate to, int limit) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());

        PluginQueryResult recordsResult = client.query("attendance.record.list_range", Map.of(
                "from", from.toString(),
                "to", to.toString()
        ));

        PluginQueryResult empResult = client.query("attendance.employee_ref.list_all", Map.of());
        Map<UUID, Map<String, Object>> emps = new LinkedHashMap<>();
        for (Map<String, Object> row : empResult.rows()) {
            UUID empId = UUID.fromString(row.get("employee_id").toString());
            emps.put(empId, row);
        }

        Map<UUID, Integer> otMap = new LinkedHashMap<>();
        for (Map<String, Object> r : recordsResult.rows()) {
            UUID empId = r.get("employee_id") != null ? UUID.fromString(r.get("employee_id").toString()) : null;
            if (empId == null) continue;

            int ot = r.get("ot_minutes") != null ? ((Number) r.get("ot_minutes")).intValue() : 0;
            if (ot > 0) {
                otMap.merge(empId, ot, Integer::sum);
            }
        }

        List<OvertimeReportDto> list = new ArrayList<>();
        for (Map.Entry<UUID, Integer> entry : otMap.entrySet()) {
            UUID empId = entry.getKey();
            Map<String, Object> empInfo = emps.getOrDefault(empId, Map.of());
            String code = (String) empInfo.getOrDefault("employee_code", "");
            String name = (String) empInfo.getOrDefault("full_name", "");
            int minutes = entry.getValue();
            double hours = Math.round((minutes / 60.0) * 10.0) / 10.0;
            list.add(new OvertimeReportDto(empId, code, name, "Kỹ thuật", hours, minutes));
        }

        list.sort(Comparator.comparing(OvertimeReportDto::otMinutes).reversed());
        int cap = limit > 0 ? Math.min(limit, list.size()) : list.size();
        return list.subList(0, cap);
    }
}
