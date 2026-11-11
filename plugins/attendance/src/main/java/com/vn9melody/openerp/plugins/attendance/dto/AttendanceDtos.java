package com.vn9melody.openerp.plugins.attendance.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.DeviceType;
import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import com.vn9melody.openerp.plugins.attendance.model.LogSource;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public final class AttendanceDtos {

    private AttendanceDtos() {}

    public record GpsCoordinates(
            @JsonProperty("lat") double lat,
            @JsonProperty("lng") double lng
    ) {}

    public record CheckInRequest(
            @JsonProperty("gps") GpsCoordinates gps
    ) {}

    public record CheckInResponse(
            @JsonProperty("log_id") UUID logId,
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("work_date") LocalDate workDate,
            @JsonProperty("shift_code") String shiftCode,
            @JsonProperty("shift_name") String shiftName,
            @JsonProperty("occurred_at") Instant occurredAt,
            @JsonProperty("geofence_flag") boolean geofenceFlag,
            @JsonProperty("source") LogSource source
    ) {}

    public record CheckOutResponse(
            @JsonProperty("log_id") UUID logId,
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("work_date") LocalDate workDate,
            @JsonProperty("occurred_at") Instant occurredAt,
            @JsonProperty("source") LogSource source
    ) {}

    public record LogDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("employee_name") String employeeName,
            @JsonProperty("event_type") LogEventType eventType,
            @JsonProperty("occurred_at") Instant occurredAt,
            @JsonProperty("work_date") LocalDate workDate,
            @JsonProperty("source") LogSource source,
            @JsonProperty("device_id") UUID deviceId,
            @JsonProperty("meta") Map<String, Object> meta,
            @JsonProperty("deleted_by") UUID deletedBy,
            @JsonProperty("deleted_reason") String deletedReason,
            @JsonProperty("deleted_at") Instant deletedAt,
            @JsonProperty("created_at") Instant createdAt
    ) {}

    public record RecordSummaryDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("work_date") LocalDate workDate,
            @JsonProperty("status") AttendanceStatus status,
            @JsonProperty("effective_in") Instant effectiveIn,
            @JsonProperty("effective_out") Instant effectiveOut,
            @JsonProperty("worked_minutes") int workedMinutes,
            @JsonProperty("late_minutes") int lateMinutes,
            @JsonProperty("early_leave_minutes") int earlyLeaveMinutes,
            @JsonProperty("ot_minutes") int otMinutes,
            @JsonProperty("is_override") boolean isOverride,
            @JsonProperty("needs_review") boolean needsReview
    ) {}

    public record ShiftSummaryDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("code") String code,
            @JsonProperty("name") String name,
            @JsonProperty("start_time") LocalTime startTime,
            @JsonProperty("end_time") LocalTime endTime,
            @JsonProperty("working_minutes") int workingMinutes
    ) {}

    public record MyStatusResponse(
            @JsonProperty("open_checkin") LogDto openCheckIn,
            @JsonProperty("last_log") LogDto lastLog,
            @JsonProperty("today_record") RecordSummaryDto todayRecord,
            @JsonProperty("shift") ShiftSummaryDto shift
    ) {}

    public record OnBehalfLogRequest(
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("event_type") LogEventType eventType,
            @JsonProperty("occurred_at") Instant occurredAt,
            @JsonProperty("reason") String reason
    ) {}

    public record DeleteLogRequest(
            @JsonProperty("reason") String reason
    ) {}

    public record KioskAuthRequest(
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("pin") String pin
    ) {}

    public record KioskAuthResponse(
            @JsonProperty("session_token") String sessionToken,
            @JsonProperty("expires_in_seconds") long expiresInSeconds,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("employee_name") String employeeName
    ) {}

    public record KioskPunchRequest(
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("event_type") LogEventType eventType
    ) {}

    public record KioskPunchResponse(
            @JsonProperty("log_id") UUID logId,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("event_type") LogEventType eventType,
            @JsonProperty("occurred_at") Instant occurredAt
    ) {}

    public record ImportRowError(
            @JsonProperty("row_index") int rowIndex,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("error_message") String errorMessage
    ) {}

    public record ImportResult(
            @JsonProperty("total") int total,
            @JsonProperty("inserted") int inserted,
            @JsonProperty("skipped") int skipped,
            @JsonProperty("errors") List<ImportRowError> errors
    ) {}

    public record PushEvent(
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("event_type") LogEventType eventType,
            @JsonProperty("occurred_at") Instant occurredAt,
            @JsonProperty("meta") Map<String, Object> meta
    ) {}

    public record PushIngestRequest(
            @JsonProperty("events") List<PushEvent> events
    ) {}

    public record PushIngestResponse(
            @JsonProperty("inserted") int inserted,
            @JsonProperty("skipped") int skipped,
            @JsonProperty("errors") List<String> errors
    ) {}

    public record DeviceCreateRequest(
            @JsonProperty("name") String name,
            @JsonProperty("device_type") DeviceType deviceType,
            @JsonProperty("branch_id") UUID branchId,
            @JsonProperty("device_code") String deviceCode,
            @JsonProperty("pin") String pin,
            @JsonProperty("ingest_secret") String ingestSecret
    ) {}

    public record DeviceUpdateRequest(
            @JsonProperty("name") String name,
            @JsonProperty("branch_id") UUID branchId,
            @JsonProperty("is_active") Boolean isActive,
            @JsonProperty("pin") String pin
    ) {}

    public record DeviceResponse(
            @JsonProperty("id") UUID id,
            @JsonProperty("name") String name,
            @JsonProperty("device_type") DeviceType deviceType,
            @JsonProperty("branch_id") UUID branchId,
            @JsonProperty("device_code") String deviceCode,
            @JsonProperty("is_active") boolean isActive,
            @JsonProperty("is_locked") boolean isLocked,
            @JsonProperty("locked_until") Instant lockedUntil,
            @JsonProperty("secret_rotated_at") Instant secretRotatedAt,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record ShiftDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("code") String code,
            @JsonProperty("name") String name,
            @JsonProperty("catalog_shift_id") UUID catalogShiftId,
            @JsonProperty("start_time") LocalTime startTime,
            @JsonProperty("end_time") LocalTime endTime,
            @JsonProperty("grace_in_minutes") int graceInMinutes,
            @JsonProperty("grace_out_minutes") int graceOutMinutes,
            @JsonProperty("break_minutes") int breakMinutes,
            @JsonProperty("ot_grace_minutes") int otGraceMinutes,
            @JsonProperty("min_ot_minutes") int minOtMinutes,
            @JsonProperty("working_minutes") int workingMinutes,
            @JsonProperty("is_active") boolean isActive,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record ShiftTemplateDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("scope_type") String scopeType,
            @JsonProperty("scope_id") UUID scopeId,
            @JsonProperty("name") String name,
            @JsonProperty("effective_from") LocalDate effectiveFrom,
            @JsonProperty("effective_to") LocalDate effectiveTo,
            @JsonProperty("week") Map<String, String> week,
            @JsonProperty("is_active") boolean isActive,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record ShiftAssignmentDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("work_date") LocalDate workDate,
            @JsonProperty("shift_definition_id") UUID shiftDefinitionId,
            @JsonProperty("source") String source,
            @JsonProperty("reason") String reason,
            @JsonProperty("created_by") UUID createdBy,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record HolidayDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("name") String name,
            @JsonProperty("holiday_date") LocalDate holidayDate,
            @JsonProperty("recurring_annual") boolean recurringAnnual,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record AttendanceRecordDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("employee_name") String employeeName,
            @JsonProperty("work_date") LocalDate workDate,
            @JsonProperty("shift_definition_id") UUID shiftDefinitionId,
            @JsonProperty("shift_name_snapshot") String shiftNameSnapshot,
            @JsonProperty("status") AttendanceStatus status,
            @JsonProperty("effective_in") Instant effectiveIn,
            @JsonProperty("effective_out") Instant effectiveOut,
            @JsonProperty("worked_minutes") int workedMinutes,
            @JsonProperty("late_minutes") int lateMinutes,
            @JsonProperty("early_leave_minutes") int earlyLeaveMinutes,
            @JsonProperty("ot_minutes") int otMinutes,
            @JsonProperty("calc_version") int calcVersion,
            @JsonProperty("is_override") boolean isOverride,
            @JsonProperty("override_reason") String overrideReason,
            @JsonProperty("override_by") UUID overrideBy,
            @JsonProperty("needs_review") boolean needsReview,
            @JsonProperty("review_note") String reviewNote,
            @JsonProperty("timesheet_id") UUID timesheetId,
            @JsonProperty("lock_version") int lockVersion,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record RecordOverrideRequest(
            @JsonProperty("status") AttendanceStatus status,
            @JsonProperty("effective_in") Instant effectiveIn,
            @JsonProperty("effective_out") Instant effectiveOut,
            @JsonProperty("worked_minutes") Integer workedMinutes,
            @JsonProperty("late_minutes") Integer lateMinutes,
            @JsonProperty("early_leave_minutes") Integer earlyLeaveMinutes,
            @JsonProperty("ot_minutes") Integer otMinutes,
            @JsonProperty("reason") String reason
    ) {}

    public record RecalculateRequest(
            @JsonProperty("employee_ids") List<UUID> employeeIds,
            @JsonProperty("from") LocalDate from,
            @JsonProperty("to") LocalDate to
    ) {}

    public record SettingsDto(
            @JsonProperty("hanging_threshold_hours") int hangingThresholdHours,
            @JsonProperty("geofence_radius_m") int geofenceRadiusM,
            @JsonProperty("default_shift_definition_id") UUID defaultShiftDefinitionId,
            @JsonProperty("mobile_require_gps") boolean mobileRequireGps,
            @JsonProperty("kiosk_enabled") boolean kioskEnabled,
            @JsonProperty("push_enabled") boolean pushEnabled,
            @JsonProperty("work_week") Map<String, Object> workWeek,
            @JsonProperty("timezone") String timezone
    ) {}
}

