package com.vn9melody.openerp.plugins.attendance.service;

import com.vn9melody.openerp.plugins.attendance.dto.AttendanceDtos.AttendanceRecordDto;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Maps attendance record rows to the API DTO, resolving employee labels when provided. */
public final class AttendanceRecordMapper {

    private AttendanceRecordMapper() {}

    public static AttendanceRecordDto map(Map<String, Object> row, Map<UUID, Map<String, Object>> employees) {
        UUID id = row.get("id") != null ? UUID.fromString(row.get("id").toString()) : UUID.randomUUID();
        UUID empId = row.get("employee_id") != null ? UUID.fromString(row.get("employee_id").toString()) : null;
        Map<String, Object> employee = empId != null && employees != null ? employees.get(empId) : null;
        String code = employee != null && employee.get("employee_code") != null
                ? employee.get("employee_code").toString() : "";
        String name = employee != null && employee.get("full_name") != null
                ? employee.get("full_name").toString() : "";
        LocalDate workDate = row.get("work_date") != null
                ? LocalDate.parse(row.get("work_date").toString()) : LocalDate.now();
        UUID shiftId = row.get("shift_definition_id") != null
                ? UUID.fromString(row.get("shift_definition_id").toString()) : null;
        String shiftName = (String) row.get("shift_name_snapshot");
        AttendanceStatus status = row.get("status") != null
                ? AttendanceStatus.valueOf(row.get("status").toString()) : AttendanceStatus.PRESENT;
        Instant effIn = row.get("effective_in") != null ? Instant.parse(row.get("effective_in").toString()) : null;
        Instant effOut = row.get("effective_out") != null ? Instant.parse(row.get("effective_out").toString()) : null;
        int worked = intOf(row.get("worked_minutes"), 0);
        int late = intOf(row.get("late_minutes"), 0);
        int early = intOf(row.get("early_leave_minutes"), 0);
        int ot = intOf(row.get("ot_minutes"), 0);
        int calcVer = intOf(row.get("calc_version"), 1);
        boolean isOverride = Boolean.TRUE.equals(row.get("is_override"));
        String overrideReason = (String) row.get("override_reason");
        UUID overrideBy = row.get("override_by") != null ? UUID.fromString(row.get("override_by").toString()) : null;
        boolean needsReview = Boolean.TRUE.equals(row.get("needs_review"));
        String reviewNote = (String) row.get("review_note");
        UUID timesheetId = row.get("timesheet_id") != null ? UUID.fromString(row.get("timesheet_id").toString()) : null;
        int lockVersion = intOf(row.get("lock_version"), 0);
        Instant createdAt = row.get("created_at") != null ? Instant.parse(row.get("created_at").toString()) : Instant.now();
        Instant updatedAt = row.get("updated_at") != null ? Instant.parse(row.get("updated_at").toString()) : Instant.now();

        return new AttendanceRecordDto(id, empId, code, name, workDate, shiftId, shiftName, status,
                effIn, effOut, worked, late, early, ot, calcVer, isOverride, overrideReason,
                overrideBy, needsReview, reviewNote, timesheetId, lockVersion, createdAt, updatedAt);
    }

    private static int intOf(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return fallback;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
