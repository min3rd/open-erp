package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.service.OrgDirectoryService.DepartmentRef;
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

    @Inject
    OrgDirectoryService orgDirectory;

    public TimesheetSummaryReportDto getSummaryReport(String scopeType, UUID scopeId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());

        List<Map<String, Object>> recordsResult = PluginDataPager.listAll(client,
                "attendance.record.list_range",
                Map.of("from", from.toString(), "to", to.toString()), 1000);

        int totalRecords = recordsResult.size();
        double presentDays = 0;
        int totalOtMinutes = 0;
        int lateCount = 0;
        int absenceCount = 0;

        for (Map<String, Object> r : recordsResult) {
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

        return new TimesheetSummaryReportDto(
                attendanceRate,
                totalOtHours,
                lateCount,
                absenceCount,
                (int) Math.round(presentDays),
                departmentBreakdown(recordsResult)
        );
    }

    /** Per-department aggregates using names resolved through the org-structure plugin. */
    private List<DepartmentReportDto> departmentBreakdown(List<Map<String, Object>> records) {
        Map<UUID, DepartmentRef> deptByEmployee = orgDirectory.departmentByEmployee();
        if (deptByEmployee.isEmpty()) {
            return List.of();
        }
        Map<UUID, DepartmentRef> departments = new LinkedHashMap<>();
        Map<UUID, double[]> stats = new LinkedHashMap<>(); // [presentDays, otMinutes, lateCount, recordCount]
        Map<UUID, Set<UUID>> employees = new LinkedHashMap<>();

        for (Map<String, Object> record : records) {
            UUID employeeId = uuid(record.get("employee_id"));
            DepartmentRef department = employeeId != null ? deptByEmployee.get(employeeId) : null;
            if (department == null) {
                continue;
            }
            departments.putIfAbsent(department.id(), department);
            double[] values = stats.computeIfAbsent(department.id(), key -> new double[4]);
            employees.computeIfAbsent(department.id(), key -> new LinkedHashSet<>()).add(employeeId);
            values[3] += 1;

            String status = (String) record.get("status");
            if (AttendanceStatus.PRESENT.name().equalsIgnoreCase(status)
                    || AttendanceStatus.WFH.name().equalsIgnoreCase(status)
                    || AttendanceStatus.BUSINESS_TRIP.name().equalsIgnoreCase(status)) {
                values[0] += 1.0;
            } else if (AttendanceStatus.HALF_DAY.name().equalsIgnoreCase(status)) {
                values[0] += 0.5;
            }
            int late = record.get("late_minutes") != null ? ((Number) record.get("late_minutes")).intValue() : 0;
            if (late > 0) {
                values[2] += 1;
            }
            int ot = record.get("ot_minutes") != null ? ((Number) record.get("ot_minutes")).intValue() : 0;
            values[1] += ot;
        }

        List<DepartmentReportDto> result = new ArrayList<>();
        for (Map.Entry<UUID, double[]> entry : stats.entrySet()) {
            DepartmentRef department = departments.get(entry.getKey());
            double[] values = entry.getValue();
            double rate = values[3] > 0 ? Math.round((values[0] / values[3]) * 1000.0) / 10.0 : 0.0;
            result.add(new DepartmentReportDto(
                    department.id(),
                    department.name(),
                    employees.getOrDefault(entry.getKey(), Set.of()).size(),
                    rate,
                    Math.round((values[1] / 60.0) * 10.0) / 10.0,
                    (int) values[2]
            ));
        }
        result.sort(Comparator.comparing(DepartmentReportDto::departmentName));
        return result;
    }

    public List<TeamMemberReportDto> getTeamReport(UUID managerEmployeeId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());

        List<Map<String, Object>> recordsResult = PluginDataPager.listAll(client,
                "attendance.record.list_range",
                Map.of("from", from.toString(), "to", to.toString()), 1000);

        List<Map<String, Object>> empResult = PluginDataPager.listAll(client,
                "attendance.employee_ref.list_all", Map.of(), 500);
        Map<UUID, Map<String, Object>> emps = new LinkedHashMap<>();
        for (Map<String, Object> row : empResult) {
            UUID empId = UUID.fromString(row.get("employee_id").toString());
            emps.put(empId, row);
        }
        Map<UUID, DepartmentRef> deptByEmployee = orgDirectory.departmentByEmployee();

        Map<UUID, TeamMemberReportDto> aggregates = new LinkedHashMap<>();
        for (Map<String, Object> r : recordsResult) {
            UUID empId = r.get("employee_id") != null ? UUID.fromString(r.get("employee_id").toString()) : null;
            if (empId == null) continue;

            Map<String, Object> empInfo = emps.getOrDefault(empId, Map.of());
            String empCode = (String) empInfo.getOrDefault("employee_code", "");
            String fullName = (String) empInfo.getOrDefault("full_name", "");
            DepartmentRef department = deptByEmployee.get(empId);
            String departmentName = department != null ? department.name() : null;

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
                    empId, empCode, fullName, departmentName, 22.0, actual, paidLeave, unpaidLeave,
                    Math.round(otHours * 10.0) / 10.0, lateCount, earlyCount
            ));
        }

        return new ArrayList<>(aggregates.values());
    }

    public List<TopLateReportDto> getTopLateReport(LocalDate from, LocalDate to, int limit) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());

        List<Map<String, Object>> recordsResult = PluginDataPager.listAll(client,
                "attendance.record.list_range",
                Map.of("from", from.toString(), "to", to.toString()), 1000);

        List<Map<String, Object>> empResult = PluginDataPager.listAll(client,
                "attendance.employee_ref.list_all", Map.of(), 500);
        Map<UUID, Map<String, Object>> emps = new LinkedHashMap<>();
        for (Map<String, Object> row : empResult) {
            UUID empId = UUID.fromString(row.get("employee_id").toString());
            emps.put(empId, row);
        }
        Map<UUID, DepartmentRef> deptByEmployee = orgDirectory.departmentByEmployee();

        Map<UUID, int[]> counts = new LinkedHashMap<>(); // [lateCount, totalLateMinutes]
        for (Map<String, Object> r : recordsResult) {
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
            DepartmentRef department = deptByEmployee.get(empId);
            list.add(new TopLateReportDto(empId, code, name,
                    department != null ? department.name() : null,
                    entry.getValue()[0], entry.getValue()[1]));
        }

        list.sort(Comparator.comparing(TopLateReportDto::totalLateMinutes).reversed());
        int cap = limit > 0 ? Math.min(limit, list.size()) : list.size();
        return list.subList(0, cap);
    }

    public List<OvertimeReportDto> getOvertimeReport(LocalDate from, LocalDate to, int limit) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());

        List<Map<String, Object>> recordsResult = PluginDataPager.listAll(client,
                "attendance.record.list_range",
                Map.of("from", from.toString(), "to", to.toString()), 1000);

        List<Map<String, Object>> empResult = PluginDataPager.listAll(client,
                "attendance.employee_ref.list_all", Map.of(), 500);
        Map<UUID, Map<String, Object>> emps = new LinkedHashMap<>();
        for (Map<String, Object> row : empResult) {
            UUID empId = UUID.fromString(row.get("employee_id").toString());
            emps.put(empId, row);
        }
        Map<UUID, DepartmentRef> deptByEmployee = orgDirectory.departmentByEmployee();

        Map<UUID, Integer> otMap = new LinkedHashMap<>();
        for (Map<String, Object> r : recordsResult) {
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
            DepartmentRef department = deptByEmployee.get(empId);
            int minutes = entry.getValue();
            double hours = Math.round((minutes / 60.0) * 10.0) / 10.0;
            list.add(new OvertimeReportDto(empId, code, name,
                    department != null ? department.name() : null, hours, minutes));
        }

        list.sort(Comparator.comparing(OvertimeReportDto::otMinutes).reversed());
        int cap = limit > 0 ? Math.min(limit, list.size()) : list.size();
        return list.subList(0, cap);
    }

    private UUID uuid(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
