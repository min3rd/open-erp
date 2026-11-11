package com.vn9melody.openerp.plugins.attendance.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.TimesheetConfirmationStatus;
import com.vn9melody.openerp.plugins.attendance.model.TimesheetScopeType;
import com.vn9melody.openerp.plugins.attendance.model.TimesheetStep;
import com.vn9melody.openerp.plugins.attendance.model.WageCalcMode;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public final class TimesheetDtos {

    private TimesheetDtos() {}

    public record TimesheetCreateRequest(
            @JsonProperty("period_year") int periodYear,
            @JsonProperty("period_month") int periodMonth,
            @JsonProperty("scope_type") TimesheetScopeType scopeType,
            @JsonProperty("scope_id") UUID scopeId,
            @JsonProperty("wage_calc_mode") WageCalcMode wageCalcMode
    ) {}

    public record TimesheetStepRequest(
            @JsonProperty("step") TimesheetStep step,
            @JsonProperty("confirm_override_loss") Boolean confirmOverrideLoss
    ) {}

    public record TimesheetRecordUpdateRequest(
            @JsonProperty("status") AttendanceStatus status,
            @JsonProperty("worked_minutes") Integer workedMinutes,
            @JsonProperty("reason") String reason
    ) {}

    public record TimesheetUnlockRequest(
            @JsonProperty("reason") String reason
    ) {}

    public record TimesheetConfirmationActionRequest(
            @JsonProperty("action") TimesheetConfirmationStatus action,
            @JsonProperty("comment") String comment
    ) {}

    public record SendConfirmationsRequest(
            @JsonProperty("employee_ids") List<UUID> employeeIds
    ) {}

    public record TimesheetExportRequest(
            @JsonProperty("template_id") UUID templateId
    ) {}

    public record ExportTemplateColumn(
            @JsonProperty("key") String key,
            @JsonProperty("label") String label,
            @JsonProperty("order") int order,
            @JsonProperty("visible") boolean visible
    ) {}

    public record ExportTemplateCreateRequest(
            @JsonProperty("name") String name,
            @JsonProperty("columns") List<ExportTemplateColumn> columns,
            @JsonProperty("is_default") Boolean isDefault
    ) {}

    public record ExportTemplateUpdateRequest(
            @JsonProperty("name") String name,
            @JsonProperty("columns") List<ExportTemplateColumn> columns,
            @JsonProperty("is_default") Boolean isDefault
    ) {}

    public record ExportTemplateDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("name") String name,
            @JsonProperty("columns") List<ExportTemplateColumn> columns,
            @JsonProperty("is_default") boolean isDefault,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record TimesheetDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("period_year") int periodYear,
            @JsonProperty("period_month") int periodMonth,
            @JsonProperty("scope_type") TimesheetScopeType scopeType,
            @JsonProperty("scope_id") UUID scopeId,
            @JsonProperty("wage_calc_mode") WageCalcMode wageCalcMode,
            @JsonProperty("step") TimesheetStep step,
            @JsonProperty("locked_at") Instant lockedAt,
            @JsonProperty("locked_by") UUID lockedBy,
            @JsonProperty("unlocked_at") Instant unlockedAt,
            @JsonProperty("unlocked_by") UUID unlockedBy,
            @JsonProperty("unlock_reason") String unlockReason,
            @JsonProperty("snapshot") Map<String, Object> snapshot,
            @JsonProperty("created_by") UUID createdBy,
            @JsonProperty("created_at") Instant createdAt,
            @JsonProperty("updated_at") Instant updatedAt
    ) {}

    public record TimesheetConfirmationDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("timesheet_id") UUID timesheetId,
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("employee_name") String employeeName,
            @JsonProperty("status") TimesheetConfirmationStatus status,
            @JsonProperty("comment") String comment,
            @JsonProperty("sent_at") Instant sentAt,
            @JsonProperty("acted_at") Instant actedAt,
            @JsonProperty("acted_by") UUID actedBy
    ) {}

    public record TimesheetExportResponse(
            @JsonProperty("file_id") UUID fileId,
            @JsonProperty("filename") String filename,
            @JsonProperty("content_type") String contentType,
            @JsonProperty("content") String content
    ) {}

    public record DepartmentReportDto(
            @JsonProperty("department_id") UUID departmentId,
            @JsonProperty("department_name") String departmentName,
            @JsonProperty("employee_count") int employeeCount,
            @JsonProperty("attendance_rate") double attendanceRate,
            @JsonProperty("total_ot_hours") double totalOtHours,
            @JsonProperty("late_count") int lateCount
    ) {}

    public record TimesheetSummaryReportDto(
            @JsonProperty("attendance_rate") double attendanceRate,
            @JsonProperty("total_ot_hours") double totalOtHours,
            @JsonProperty("late_count") int lateCount,
            @JsonProperty("absence_count") int absenceCount,
            @JsonProperty("by_department") List<DepartmentReportDto> byDepartment
    ) {}

    public record TeamMemberReportDto(
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("full_name") String fullName,
            @JsonProperty("department_name") String departmentName,
            @JsonProperty("standard_days") double standardDays,
            @JsonProperty("actual_days") double actualDays,
            @JsonProperty("paid_leave_days") double paidLeaveDays,
            @JsonProperty("unpaid_leave_days") double unpaidLeaveDays,
            @JsonProperty("ot_hours") double otHours,
            @JsonProperty("late_count") int lateCount,
            @JsonProperty("early_count") int earlyCount
    ) {}

    public record TopLateReportDto(
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("full_name") String fullName,
            @JsonProperty("department_name") String departmentName,
            @JsonProperty("late_count") int lateCount,
            @JsonProperty("total_late_minutes") int totalLateMinutes
    ) {}

    public record OvertimeReportDto(
            @JsonProperty("employee_id") UUID employeeId,
            @JsonProperty("employee_code") String employeeCode,
            @JsonProperty("full_name") String fullName,
            @JsonProperty("department_name") String departmentName,
            @JsonProperty("ot_hours") double otHours,
            @JsonProperty("ot_minutes") int otMinutes
    ) {}
}

