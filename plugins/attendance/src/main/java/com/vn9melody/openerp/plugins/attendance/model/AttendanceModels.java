package com.vn9melody.openerp.plugins.attendance.model;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

/**
 * Domain records for the Attendance plugin.
 */
public final class AttendanceModels {

    private AttendanceModels() {}

    public record AttendanceLog(
            UUID id,
            UUID tenantId,
            UUID employeeId,
            LogEventType eventType,
            Instant occurredAt,
            LocalDate workDate,
            LogSource source,
            UUID deviceId,
            Map<String, Object> meta,
            UUID deletedBy,
            String deletedReason,
            Instant deletedAt,
            Instant createdAt
    ) {}

    public record AttendanceDevice(
            UUID id,
            UUID tenantId,
            String name,
            DeviceType deviceType,
            UUID branchId,
            String deviceCode,
            String pinHash,
            String ingestSecretHash,
            Instant secretRotatedAt,
            Instant lockedUntil,
            boolean isActive,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record AttendanceSettings(
            UUID id,
            UUID tenantId,
            int hangingThresholdHours,
            int geofenceRadiusM,
            UUID defaultShiftDefinitionId,
            boolean mobileRequireGps,
            boolean kioskEnabled,
            boolean pushEnabled,
            String workWeekJson,
            String timezone,
            Instant updatedAt
    ) {}

    public record EmployeeRef(
            UUID id,
            UUID tenantId,
            UUID employeeId,
            String employeeCode,
            String fullName,
            UUID userId,
            UUID primaryBranchId,
            UUID primaryDepartmentId,
            UUID managerEmployeeId,
            String employmentStatus,
            LocalDate hireDate,
            LocalDate exitDate,
            Instant syncedAt
    ) {}

    public record ShiftDefinitionEntity(
            UUID id,
            UUID tenantId,
            String code,
            String name,
            UUID catalogShiftId,
            LocalTime startTime,
            LocalTime endTime,
            int graceInMinutes,
            int graceOutMinutes,
            int breakMinutes,
            int otGraceMinutes,
            int minOtMinutes,
            int workingMinutes,
            boolean isActive,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record AttendanceRecordEntity(
            UUID id,
            UUID tenantId,
            UUID employeeId,
            LocalDate workDate,
            UUID shiftDefinitionId,
            String shiftNameSnapshot,
            AttendanceStatus status,
            Instant effectiveIn,
            Instant effectiveOut,
            int workedMinutes,
            int lateMinutes,
            int earlyLeaveMinutes,
            int otMinutes,
            int calcVersion,
            boolean isOverride,
            String overrideReason,
            UUID overrideBy,
            boolean needsReview,
            String reviewNote,
            UUID timesheetId,
            int lockVersion,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record BranchLocation(
            UUID branchId,
            String branchName,
            double latitude,
            double longitude,
            int radiusMeters
    ) {}
}

