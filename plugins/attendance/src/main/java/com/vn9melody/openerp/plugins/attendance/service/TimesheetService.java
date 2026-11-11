package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.TimesheetDtos.*;
import com.vn9melody.openerp.plugins.attendance.model.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@ApplicationScoped
public class TimesheetService {

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    ExportTemplateService exportTemplateService;

    public PagedData<TimesheetDto> listTimesheets(Integer year, Integer month, String scopeType, String step, int page, int size) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (year != null) params.put("period_year", year);
        if (month != null) params.put("period_month", month);
        if (scopeType != null && !scopeType.isBlank()) params.put("scope_type", scopeType);
        if (step != null && !step.isBlank()) params.put("step", step);
        params.put("page", page > 0 ? page : 1);
        params.put("size", size > 0 ? size : 20);

        PluginQueryResult result = client.query("attendance.timesheet.list", params);
        List<TimesheetDto> items = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            items.add(mapTimesheetRow(row));
        }

        long total = result.totalRows() > 0 ? result.totalRows() : items.size();
        return PagedData.of(items, page > 0 ? page : 1, size > 0 ? size : 20, total);
    }

    public TimesheetDto getTimesheet(UUID id) {
        PluginQueryResult result = client.query("attendance.timesheet.get_by_id", Map.of("id", id));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_TIMESHEET_NOT_FOUND,
                    "Timesheet not found", Map.of("id", id.toString()));
        }
        return mapTimesheetRow(result.rows().get(0));
    }

    public TimesheetDto createTimesheet(UUID createdBy, TimesheetCreateRequest req) {
        if (req == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Request body is required", Map.of());
        }
        if (req.periodYear() < 2020 || req.periodYear() > 2100) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Invalid period year: " + req.periodYear(), Map.of());
        }
        if (req.periodMonth() < 1 || req.periodMonth() > 12) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Invalid period month: " + req.periodMonth(), Map.of());
        }

        TimesheetScopeType scopeType = req.scopeType() != null ? req.scopeType() : TimesheetScopeType.TENANT;
        WageCalcMode calcMode = req.wageCalcMode() != null ? req.wageCalcMode() : WageCalcMode.STANDARD_MINUS_UNPAID;

        // Check duplicated
        Map<String, Object> checkParams = new LinkedHashMap<>();
        checkParams.put("scope_type", scopeType.name());
        checkParams.put("period_year", req.periodYear());
        checkParams.put("period_month", req.periodMonth());
        PluginQueryResult existing = client.query("attendance.timesheet.get_by_period", checkParams);
        if (!existing.rows().isEmpty()) {
            throw new ApiException(409, AttendanceErrorCode.ATTENDANCE_TIMESHEET_DUPLICATED,
                    "Timesheet already exists for this period and scope",
                    Map.of("period_year", req.periodYear(), "period_month", req.periodMonth(), "scope_type", scopeType.name()));
        }

        Map<String, Object> insertParams = new LinkedHashMap<>();
        insertParams.put("period_year", req.periodYear());
        insertParams.put("period_month", req.periodMonth());
        insertParams.put("scope_type", scopeType.name());
        insertParams.put("scope_id", req.scopeId());
        insertParams.put("wage_calc_mode", calcMode.name());
        insertParams.put("step", TimesheetStep.S1_LOGS.name());
        insertParams.put("created_by", createdBy);

        PluginQueryResult result = client.write("attendance.timesheet.insert", insertParams);
        UUID id = UUID.fromString(result.rows().get(0).get("id").toString());
        return getTimesheet(id);
    }

    public TimesheetDto transitionStep(UUID timesheetId, UUID currentUserId, TimesheetStepRequest req) {
        TimesheetDto current = getTimesheet(timesheetId);
        if (current.lockedAt() != null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_RECORD_LOCKED,
                    "Timesheet is locked and cannot change step", Map.of("id", timesheetId.toString()));
        }
        if (req == null || req.step() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_TIMESHEET_INVALID_STEP,
                    "Target step is required", Map.of());
        }

        TimesheetStep targetStep = req.step();

        // Regression check (BR-A05 & AC-T01): If going backwards from S4_ADJUST or DONE to S1, S2, S3
        // and snapshot contains manual overrides, require confirm_override_loss = true
        if (targetStep.order() < current.step().order()) {
            boolean hasOverrides = hasManualOverrides(current);
            if (hasOverrides && !Boolean.TRUE.equals(req.confirmOverrideLoss())) {
                throw new ApiException(409, AttendanceErrorCode.ATTENDANCE_TIMESHEET_OVERRIDE_LOSS,
                        "Reverting to previous step will cause loss of manual adjustments. Set confirm_override_loss to true to proceed.",
                        Map.of("current_step", current.step().name(), "target_step", targetStep.name()));
            }
        }

        Map<String, Object> snapshot = current.snapshot();

        // At Step 3 (S3_CALCULATE): Run batch calculation & create snapshot
        if (targetStep == TimesheetStep.S3_CALCULATE || (targetStep.order() >= TimesheetStep.S3_CALCULATE.order() && snapshot == null)) {
            snapshot = computePeriodSnapshot(current);
        }

        Map<String, Object> updateParams = new LinkedHashMap<>();
        updateParams.put("id", timesheetId);
        updateParams.put("step", targetStep.name());
        updateParams.put("snapshot", serializeJson(snapshot));
        updateParams.put("updated_at", Instant.now().toString());

        client.write("attendance.timesheet.update_step", updateParams);
        return getTimesheet(timesheetId);
    }

    public void updateRecordInStep4(UUID timesheetId, UUID recordId, UUID currentUserId, TimesheetRecordUpdateRequest req) {
        TimesheetDto ts = getTimesheet(timesheetId);
        if (ts.lockedAt() != null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_RECORD_LOCKED,
                    "Timesheet is locked. Cannot adjust records.", Map.of());
        }
        if (req == null || req.reason() == null || req.reason().isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Reason is mandatory when adjusting record in step 4", Map.of());
        }

        // Fetch existing record
        PluginQueryResult recResult = client.query("attendance.record.get_by_id", Map.of("id", recordId));
        if (recResult.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_RECORD_NOT_FOUND,
                    "Attendance record not found", Map.of("id", recordId.toString()));
        }

        Map<String, Object> updateParams = new LinkedHashMap<>();
        updateParams.put("id", recordId);
        if (req.status() != null) updateParams.put("status", req.status().name());
        if (req.workedMinutes() != null) updateParams.put("worked_minutes", req.workedMinutes());
        updateParams.put("is_override", true);
        updateParams.put("override_reason", req.reason().trim());
        updateParams.put("override_by", currentUserId);
        updateParams.put("updated_at", Instant.now().toString());

        client.write("attendance.record.update_by_timesheet", updateParams);

        // Mark overrides in snapshot
        if (ts.snapshot() != null) {
            Map<String, Object> snap = new LinkedHashMap<>(ts.snapshot());
            snap.put("has_manual_adjustments", true);
            client.write("attendance.timesheet.update_step", Map.of(
                    "id", timesheetId,
                    "step", ts.step().name(),
                    "snapshot", serializeJson(snap),
                    "updated_at", Instant.now().toString()
            ));
        }
    }

    public int sendConfirmations(UUID timesheetId, UUID currentUserId, SendConfirmationsRequest req) {
        TimesheetDto ts = getTimesheet(timesheetId);
        if (ts.lockedAt() != null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_CONFIRMATION_CLOSED,
                    "Cannot send confirmations for a locked timesheet", Map.of());
        }

        List<UUID> targetEmployeeIds = req != null && req.employeeIds() != null && !req.employeeIds().isEmpty()
                ? req.employeeIds()
                : extractEmployeeIdsFromScope(ts);

        int sentCount = 0;
        for (UUID empId : targetEmployeeIds) {
            try {
                Map<String, Object> insertParams = new LinkedHashMap<>();
                insertParams.put("timesheet_id", timesheetId);
                insertParams.put("employee_id", empId);
                insertParams.put("status", TimesheetConfirmationStatus.PENDING.name());
                client.write("attendance.confirmation.insert", insertParams);
                sentCount++;
            } catch (Exception ignored) {
                // Ignore if duplicate confirmation already exists
            }
        }
        return sentCount;
    }

    public List<TimesheetConfirmationDto> listConfirmations(UUID timesheetId, String status) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("timesheet_id", timesheetId);
        if (status != null && !status.isBlank()) {
            params.put("status", status);
        }
        PluginQueryResult result = client.query("attendance.confirmation.list", params);
        List<TimesheetConfirmationDto> list = new ArrayList<>();
        for (Map<String, Object> row : result.rows()) {
            list.add(mapConfirmationRow(row));
        }
        return list;
    }

    public TimesheetConfirmationDto actOnConfirmation(UUID confirmationId, UUID currentUserId, TimesheetConfirmationActionRequest req) {
        PluginQueryResult result = client.query("attendance.confirmation.get_by_id", Map.of("id", confirmationId));
        if (result.rows().isEmpty()) {
            throw new ApiException(404, AttendanceErrorCode.ATTENDANCE_CONFIRMATION_NOT_FOUND,
                    "Confirmation record not found", Map.of("id", confirmationId.toString()));
        }

        Map<String, Object> row = result.rows().get(0);
        String currentStatus = (String) row.get("status");
        if (!TimesheetConfirmationStatus.PENDING.name().equalsIgnoreCase(currentStatus)) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_CONFIRMATION_CLOSED,
                    "Confirmation has already been acted upon", Map.of("status", currentStatus));
        }

        UUID tsId = UUID.fromString(row.get("timesheet_id").toString());
        TimesheetDto ts = getTimesheet(tsId);
        if (ts.lockedAt() != null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_CONFIRMATION_CLOSED,
                    "Timesheet is locked; confirmation is closed.", Map.of());
        }

        if (req == null || req.action() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Action (CONFIRM or REJECT) is required", Map.of());
        }

        Map<String, Object> updateParams = new LinkedHashMap<>();
        updateParams.put("id", confirmationId);
        updateParams.put("status", req.action().name());
        updateParams.put("comment", req.comment());
        updateParams.put("acted_at", Instant.now().toString());
        updateParams.put("acted_by", currentUserId);

        client.write("attendance.confirmation.update", updateParams);

        PluginQueryResult updated = client.query("attendance.confirmation.get_by_id", Map.of("id", confirmationId));
        return mapConfirmationRow(updated.rows().get(0));
    }

    public TimesheetDto lockTimesheet(UUID timesheetId, UUID currentUserId) {
        TimesheetDto ts = getTimesheet(timesheetId);
        if (ts.step() != TimesheetStep.DONE) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_TIMESHEET_NOT_DONE,
                    "Timesheet must be in DONE step before locking", Map.of("current_step", ts.step().name()));
        }

        Instant now = Instant.now();
        Map<String, Object> lockParams = new LinkedHashMap<>();
        lockParams.put("id", timesheetId);
        lockParams.put("locked_at", now.toString());
        lockParams.put("locked_by", currentUserId);
        lockParams.put("updated_at", now.toString());

        client.write("attendance.timesheet.lock", lockParams);

        // Lock associated attendance records in the period
        lockPeriodRecords(ts);

        // Publish outbox event
        publishTimesheetLockedEvent(timesheetId, ts);

        return getTimesheet(timesheetId);
    }

    public TimesheetDto unlockTimesheet(UUID timesheetId, UUID currentUserId, String reason) {
        TimesheetDto ts = getTimesheet(timesheetId);
        if (ts.lockedAt() == null) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_TIMESHEET_NOT_LOCKED,
                    "Timesheet is not currently locked", Map.of());
        }
        if (reason == null || reason.isBlank()) {
            throw new ApiException(400, AttendanceErrorCode.ATTENDANCE_VALIDATION_ERROR,
                    "Unlock reason is required", Map.of());
        }

        Instant now = Instant.now();
        Map<String, Object> unlockParams = new LinkedHashMap<>();
        unlockParams.put("id", timesheetId);
        unlockParams.put("locked_at", null);
        unlockParams.put("locked_by", null);
        unlockParams.put("unlocked_at", now.toString());
        unlockParams.put("unlocked_by", currentUserId);
        unlockParams.put("unlock_reason", reason.trim());
        unlockParams.put("updated_at", now.toString());

        client.write("attendance.timesheet.unlock", unlockParams);
        return getTimesheet(timesheetId);
    }

    public TimesheetExportResponse exportTimesheet(UUID timesheetId, UUID templateId) {
        TimesheetDto ts = getTimesheet(timesheetId);

        ExportTemplateDto template;
        if (templateId != null) {
            template = exportTemplateService.getTemplate(templateId);
        } else {
            List<ExportTemplateDto> all = exportTemplateService.listTemplates();
            template = all.stream().filter(ExportTemplateDto::isDefault).findFirst()
                    .orElseGet(() -> all.isEmpty() ? createDefaultTemplate() : all.get(0));
        }

        // Build CSV content from snapshot
        String csvContent = generateCsvFromSnapshot(ts, template);
        String filename = String.format("timesheet_%d_%02d.csv", ts.periodYear(), ts.periodMonth());

        return new TimesheetExportResponse(
                UUID.randomUUID(),
                filename,
                "text/csv",
                csvContent
        );
    }

    private boolean hasManualOverrides(TimesheetDto ts) {
        if (ts.snapshot() != null && Boolean.TRUE.equals(ts.snapshot().get("has_manual_adjustments"))) {
            return true;
        }
        // Also check if any record in the period has is_override = true
        LocalDate from = LocalDate.of(ts.periodYear(), ts.periodMonth(), 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        PluginQueryResult recs = client.query("attendance.record.list_range", Map.of("from", from.toString(), "to", to.toString()));
        for (Map<String, Object> r : recs.rows()) {
            if (Boolean.TRUE.equals(r.get("is_override"))) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> computePeriodSnapshot(TimesheetDto ts) {
        LocalDate from = LocalDate.of(ts.periodYear(), ts.periodMonth(), 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());

        PluginQueryResult recordsResult = client.query("attendance.record.list_range", Map.of("from", from.toString(), "to", to.toString()));
        PluginQueryResult empResult = client.query("attendance.employee_ref.list_all", Map.of());

        Map<UUID, Map<String, Object>> employeeMap = new LinkedHashMap<>();
        for (Map<String, Object> emp : empResult.rows()) {
            UUID empId = UUID.fromString(emp.get("employee_id").toString());
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("employee_id", empId.toString());
            summary.put("employee_code", emp.get("employee_code"));
            summary.put("full_name", emp.get("full_name"));
            summary.put("standard_days", 22.0);
            summary.put("actual_days", 0.0);
            summary.put("paid_leave_days", 0.0);
            summary.put("unpaid_leave_days", 0.0);
            summary.put("ot_minutes", 0);
            summary.put("ot_hours", 0.0);
            summary.put("late_minutes", 0);
            summary.put("early_leave_minutes", 0);
            employeeMap.put(empId, summary);
        }

        boolean hasOverrides = false;
        for (Map<String, Object> rec : recordsResult.rows()) {
            UUID empId = rec.get("employee_id") != null ? UUID.fromString(rec.get("employee_id").toString()) : null;
            if (empId == null) continue;

            Map<String, Object> summary = employeeMap.computeIfAbsent(empId, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("employee_id", k.toString());
                m.put("employee_code", "");
                m.put("full_name", "");
                m.put("standard_days", 22.0);
                m.put("actual_days", 0.0);
                m.put("paid_leave_days", 0.0);
                m.put("unpaid_leave_days", 0.0);
                m.put("ot_minutes", 0);
                m.put("ot_hours", 0.0);
                m.put("late_minutes", 0);
                m.put("early_leave_minutes", 0);
                return m;
            });

            String status = (String) rec.get("status");
            if (AttendanceStatus.PRESENT.name().equalsIgnoreCase(status)
                    || AttendanceStatus.WFH.name().equalsIgnoreCase(status)
                    || AttendanceStatus.BUSINESS_TRIP.name().equalsIgnoreCase(status)) {
                summary.put("actual_days", (double) summary.get("actual_days") + 1.0);
            } else if (AttendanceStatus.HALF_DAY.name().equalsIgnoreCase(status)) {
                summary.put("actual_days", (double) summary.get("actual_days") + 0.5);
                summary.put("unpaid_leave_days", (double) summary.get("unpaid_leave_days") + 0.5);
            } else if (AttendanceStatus.ON_LEAVE.name().equalsIgnoreCase(status)) {
                summary.put("paid_leave_days", (double) summary.get("paid_leave_days") + 1.0);
            } else if (AttendanceStatus.ABSENT.name().equalsIgnoreCase(status)) {
                summary.put("unpaid_leave_days", (double) summary.get("unpaid_leave_days") + 1.0);
            }

            int ot = rec.get("ot_minutes") != null ? ((Number) rec.get("ot_minutes")).intValue() : 0;
            int late = rec.get("late_minutes") != null ? ((Number) rec.get("late_minutes")).intValue() : 0;
            int early = rec.get("early_leave_minutes") != null ? ((Number) rec.get("early_leave_minutes")).intValue() : 0;

            summary.put("ot_minutes", (int) summary.get("ot_minutes") + ot);
            summary.put("ot_hours", ((int) summary.get("ot_minutes")) / 60.0);
            summary.put("late_minutes", (int) summary.get("late_minutes") + late);
            summary.put("early_leave_minutes", (int) summary.get("early_leave_minutes") + early);

            if (Boolean.TRUE.equals(rec.get("is_override"))) {
                hasOverrides = true;
            }
        }

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("period_year", ts.periodYear());
        snapshot.put("period_month", ts.periodMonth());
        snapshot.put("calculated_at", Instant.now().toString());
        snapshot.put("wage_calc_mode", ts.wageCalcMode().name());
        snapshot.put("has_manual_adjustments", hasOverrides);
        snapshot.put("total_employees", employeeMap.size());
        snapshot.put("employees", new ArrayList<>(employeeMap.values()));

        return snapshot;
    }

    private void lockPeriodRecords(TimesheetDto ts) {
        LocalDate from = LocalDate.of(ts.periodYear(), ts.periodMonth(), 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        PluginQueryResult recs = client.query("attendance.record.list_range", Map.of("from", from.toString(), "to", to.toString()));
        for (Map<String, Object> r : recs.rows()) {
            UUID recId = UUID.fromString(r.get("id").toString());
            client.write("attendance.record.lock_by_id", Map.of(
                    "id", recId,
                    "timesheet_id", ts.id(),
                    "updated_at", Instant.now().toString()
            ));
        }
    }

    private void publishTimesheetLockedEvent(UUID timesheetId, TimesheetDto ts) {
        Map<String, Object> payload = Map.of(
                "timesheet_id", timesheetId.toString(),
                "period_year", ts.periodYear(),
                "period_month", ts.periodMonth(),
                "scope_type", ts.scopeType().name(),
                "wage_calc_mode", ts.wageCalcMode().name(),
                "locked_at", Instant.now().toString()
        );
        Map<String, Object> outboxParams = new LinkedHashMap<>();
        outboxParams.put("event_type", "attendance.timesheet.locked");
        outboxParams.put("aggregate_id", timesheetId);
        outboxParams.put("payload", serializeJson(payload));
        outboxParams.put("status", "PENDING");
        try {
            client.write("attendance.outbox.insert", outboxParams);
        } catch (Exception ignored) {}
    }

    private List<UUID> extractEmployeeIdsFromScope(TimesheetDto ts) {
        if (ts.snapshot() != null && ts.snapshot().get("employees") instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> emps = (List<Map<String, Object>>) ts.snapshot().get("employees");
            List<UUID> ids = new ArrayList<>();
            for (Map<String, Object> e : emps) {
                if (e.get("employee_id") != null) {
                    ids.add(UUID.fromString(e.get("employee_id").toString()));
                }
            }
            if (!ids.isEmpty()) return ids;
        }

        PluginQueryResult empResult = client.query("attendance.employee_ref.list_all", Map.of());
        List<UUID> ids = new ArrayList<>();
        for (Map<String, Object> r : empResult.rows()) {
            ids.add(UUID.fromString(r.get("employee_id").toString()));
        }
        return ids;
    }

    private String generateCsvFromSnapshot(TimesheetDto ts, ExportTemplateDto template) {
        StringBuilder sb = new StringBuilder();
        List<ExportTemplateColumn> cols = template.columns();

        // Header line
        for (int i = 0; i < cols.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(cols.get(i).label().replace("\"", "\"\"")).append("\"");
        }
        sb.append("\n");

        if (ts.snapshot() == null || !(ts.snapshot().get("employees") instanceof List)) {
            return sb.toString();
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> emps = (List<Map<String, Object>>) ts.snapshot().get("employees");
        for (Map<String, Object> emp : emps) {
            for (int i = 0; i < cols.size(); i++) {
                if (i > 0) sb.append(",");
                String key = cols.get(i).key();
                String val = extractColumnValue(key, emp);
                sb.append("\"").append(val.replace("\"", "\"\"")).append("\"");
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private String extractColumnValue(String key, Map<String, Object> emp) {
        return switch (key) {
            case "EMPLOYEE_CODE" -> String.valueOf(emp.getOrDefault("employee_code", ""));
            case "FULL_NAME" -> String.valueOf(emp.getOrDefault("full_name", ""));
            case "DEPARTMENT" -> String.valueOf(emp.getOrDefault("department_name", ""));
            case "BRANCH" -> String.valueOf(emp.getOrDefault("branch_name", ""));
            case "STANDARD_DAYS" -> String.valueOf(emp.getOrDefault("standard_days", "22.0"));
            case "ACTUAL_DAYS" -> String.valueOf(emp.getOrDefault("actual_days", "0.0"));
            case "PAID_LEAVE_DAYS" -> String.valueOf(emp.getOrDefault("paid_leave_days", "0.0"));
            case "UNPAID_LEAVE_DAYS" -> String.valueOf(emp.getOrDefault("unpaid_leave_days", "0.0"));
            case "OT_NORMAL_HOURS" -> String.valueOf(emp.getOrDefault("ot_hours", "0.0"));
            case "OT_NIGHT_HOURS" -> "0.0";
            case "LATE_MINUTES" -> String.valueOf(emp.getOrDefault("late_minutes", "0"));
            case "EARLY_MINUTES" -> String.valueOf(emp.getOrDefault("early_leave_minutes", "0"));
            default -> "";
        };
    }

    private ExportTemplateDto createDefaultTemplate() {
        List<ExportTemplateColumn> cols = List.of(
                new ExportTemplateColumn("EMPLOYEE_CODE", "Mã nhân viên", 1, true),
                new ExportTemplateColumn("FULL_NAME", "Họ và tên", 2, true),
                new ExportTemplateColumn("DEPARTMENT", "Phòng ban", 3, true),
                new ExportTemplateColumn("STANDARD_DAYS", "Công chuẩn", 4, true),
                new ExportTemplateColumn("ACTUAL_DAYS", "Công thực tế", 5, true),
                new ExportTemplateColumn("PAID_LEAVE_DAYS", "Nghỉ phép", 6, true),
                new ExportTemplateColumn("UNPAID_LEAVE_DAYS", "Nghỉ không lương", 7, true),
                new ExportTemplateColumn("OT_NORMAL_HOURS", "Giờ OT", 8, true),
                new ExportTemplateColumn("LATE_MINUTES", "Đi muộn (phút)", 9, true),
                new ExportTemplateColumn("EARLY_MINUTES", "Về sớm (phút)", 10, true)
        );
        return new ExportTemplateDto(UUID.randomUUID(), "Standard Payroll Export", cols, true, Instant.now(), Instant.now());
    }

    private TimesheetDto mapTimesheetRow(Map<String, Object> row) {
        UUID id = UUID.fromString(row.get("id").toString());
        int year = ((Number) row.get("period_year")).intValue();
        int month = ((Number) row.get("period_month")).intValue();
        TimesheetScopeType scopeType = TimesheetScopeType.valueOf(row.get("scope_type").toString());
        UUID scopeId = row.get("scope_id") != null ? UUID.fromString(row.get("scope_id").toString()) : null;
        WageCalcMode calcMode = row.get("wage_calc_mode") != null
                ? WageCalcMode.valueOf(row.get("wage_calc_mode").toString())
                : WageCalcMode.STANDARD_MINUS_UNPAID;
        TimesheetStep step = TimesheetStep.valueOf(row.get("step").toString());
        Instant lockedAt = row.get("locked_at") != null ? Instant.parse(row.get("locked_at").toString()) : null;
        UUID lockedBy = row.get("locked_by") != null ? UUID.fromString(row.get("locked_by").toString()) : null;
        Instant unlockedAt = row.get("unlocked_at") != null ? Instant.parse(row.get("unlocked_at").toString()) : null;
        UUID unlockedBy = row.get("unlocked_by") != null ? UUID.fromString(row.get("unlocked_by").toString()) : null;
        String unlockReason = (String) row.get("unlock_reason");
        UUID createdBy = row.get("created_by") != null ? UUID.fromString(row.get("created_by").toString()) : null;
        Instant createdAt = row.get("created_at") != null ? Instant.parse(row.get("created_at").toString()) : Instant.now();
        Instant updatedAt = row.get("updated_at") != null ? Instant.parse(row.get("updated_at").toString()) : Instant.now();

        Map<String, Object> snapshot = parseSnapshot(row.get("snapshot"));

        return new TimesheetDto(
                id, year, month, scopeType, scopeId, calcMode, step,
                lockedAt, lockedBy, unlockedAt, unlockedBy, unlockReason,
                snapshot, createdBy, createdAt, updatedAt
        );
    }

    private TimesheetConfirmationDto mapConfirmationRow(Map<String, Object> row) {
        UUID id = UUID.fromString(row.get("id").toString());
        UUID tsId = UUID.fromString(row.get("timesheet_id").toString());
        UUID empId = UUID.fromString(row.get("employee_id").toString());
        TimesheetConfirmationStatus status = TimesheetConfirmationStatus.valueOf(row.get("status").toString());
        String comment = (String) row.get("comment");
        Instant sentAt = row.get("sent_at") != null ? Instant.parse(row.get("sent_at").toString()) : Instant.now();
        Instant actedAt = row.get("acted_at") != null ? Instant.parse(row.get("acted_at").toString()) : null;
        UUID actedBy = row.get("acted_by") != null ? UUID.fromString(row.get("acted_by").toString()) : null;

        return new TimesheetConfirmationDto(id, tsId, empId, "", "", status, comment, sentAt, actedAt, actedBy);
    }

    private Map<String, Object> parseSnapshot(Object val) {
        if (val == null) return null;
        if (val instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> m = (Map<String, Object>) val;
            return m;
        }
        try {
            return objectMapper.readValue(val.toString(), new TypeReference<>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private String serializeJson(Object val) {
        if (val == null) return null;
        try {
            return objectMapper.writeValueAsString(val);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
