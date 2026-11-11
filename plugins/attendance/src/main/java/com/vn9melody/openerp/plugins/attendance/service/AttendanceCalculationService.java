package com.vn9melody.openerp.plugins.attendance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.data.PluginQueryResult;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.attendance.engine.AttendanceCalculator;
import com.vn9melody.openerp.plugins.attendance.engine.ShiftResolver;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceModels.ShiftDefinitionEntity;
import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.*;
import com.vn9melody.openerp.plugins.attendance.model.ShiftDef;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Service for computing daily attendance records (ADR-S09-003, TASK-446).
 * Integrates ShiftResolver and AttendanceCalculator, honors manual overrides (is_override = true),
 * detects hanging check-ins (> 16h), and persists records and review outbox events.
 */
@ApplicationScoped
public class AttendanceCalculationService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int DEFAULT_HANGING_THRESHOLD_HOURS = 16;

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext tenantContext;

    @Inject
    ObjectMapper objectMapper;

    public record HangingDetectionResult(
            UUID logId,
            UUID employeeId,
            Instant occurredAt,
            long hoursOpen,
            boolean isHanging
    ) {}

    /**
     * Idempotently calculates or recalculates daily attendance for one employee on a given work date.
     */
    public CalcResult calculateDay(UUID employeeId, LocalDate workDate,
                                   ShiftResolution shiftResolution,
                                   List<LogEntry> logs,
                                   List<OtWindow> otWindows,
                                   boolean isHoliday,
                                   Map<String, Object> existingRecord,
                                   int hangingThresholdHours) {
        // BR-A05: Never overwrite manual overrides
        if (existingRecord != null && Boolean.TRUE.equals(existingRecord.get("is_override"))) {
            AttendanceStatus status = parseStatus(existingRecord.get("status"));
            int worked = parseInteger(existingRecord.get("worked_minutes"), 0);
            int late = parseInteger(existingRecord.get("late_minutes"), 0);
            int early = parseInteger(existingRecord.get("early_leave_minutes"), 0);
            int ot = parseInteger(existingRecord.get("ot_minutes"), 0);
            LocalDateTime in = parseDateTime(existingRecord.get("effective_in"));
            LocalDateTime out = parseDateTime(existingRecord.get("effective_out"));
            boolean needsReview = Boolean.TRUE.equals(existingRecord.get("needs_review"));
            String reviewNote = (String) existingRecord.get("review_note");

            return new CalcResult(true, status, in, out, worked, late, early, ot, needsReview, reviewNote);
        }

        ShiftDef shift = shiftResolution != null ? shiftResolution.shift() : null;
        String shiftName = shift != null ? shift.code() : "Chưa xếp ca";

        CalcInput input = new CalcInput(workDate, shift, shiftName, logs, otWindows, isHoliday, null);
        CalcResult result = AttendanceCalculator.calculate(input);

        // Hanging check evaluation: if last punch is IN and older than threshold without OUT
        int threshold = hangingThresholdHours > 0 ? hangingThresholdHours : DEFAULT_HANGING_THRESHOLD_HOURS;
        boolean isHanging = checkHangingPunch(logs, workDate, threshold);
        if (isHanging) {
            result = new CalcResult(
                    result.createRecord(),
                    result.status(),
                    result.effectiveIn(),
                    result.effectiveOut(),
                    result.workedMinutes(),
                    result.lateMinutes(),
                    result.earlyLeaveMinutes(),
                    result.otMinutes(),
                    true,
                    "HANGING_CHECK_IN"
            );
        }

        // Persist record via PluginDataClient
        persistRecord(employeeId, workDate, shift, shiftName, result);

        // If needs review, publish outbox event
        if (result.needsReview()) {
            publishNeedsReviewEvent(employeeId, workDate, result);
        }

        return result;
    }

    /**
     * Checks if a set of logs has an unclosed IN punch older than threshold hours.
     */
    public boolean checkHangingPunch(List<LogEntry> logs, LocalDate workDate, int thresholdHours) {
        if (logs == null || logs.isEmpty()) {
            return false;
        }
        // sort by occurred time
        List<LogEntry> sorted = new ArrayList<>(logs);
        sorted.sort(Comparator.comparing(LogEntry::at));
        LogEntry last = sorted.get(sorted.size() - 1);

        if (last.checkIn()) {
            LocalDateTime now = LocalDateTime.now(DEFAULT_ZONE);
            long hours = Duration.between(last.at(), now).toHours();
            return hours >= thresholdHours;
        }
        return false;
    }

    private void persistRecord(UUID employeeId, LocalDate workDate, ShiftDef shift, String shiftName, CalcResult result) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("employee_id", employeeId);
        params.put("work_date", workDate.toString());
        params.put("shift_definition_id", null);
        params.put("shift_name_snapshot", shiftName);
        params.put("status", result.status().name());
        params.put("effective_in", result.effectiveIn() != null ? result.effectiveIn().atZone(DEFAULT_ZONE).toInstant().toString() : null);
        params.put("effective_out", result.effectiveOut() != null ? result.effectiveOut().atZone(DEFAULT_ZONE).toInstant().toString() : null);
        params.put("worked_minutes", result.workedMinutes());
        params.put("late_minutes", result.lateMinutes());
        params.put("early_leave_minutes", result.earlyLeaveMinutes());
        params.put("ot_minutes", result.otMinutes());
        params.put("calc_version", 1);
        params.put("needs_review", result.needsReview());
        params.put("review_note", result.reviewNote());

        client.write("attendance.record.upsert", params);
    }

    private void publishNeedsReviewEvent(UUID employeeId, LocalDate workDate, CalcResult result) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("employee_id", employeeId.toString());
        payload.put("work_date", workDate.toString());
        payload.put("status", result.status().name());
        payload.put("review_note", result.reviewNote());

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("event_type", "attendance.record.needs_review");
        params.put("aggregate_id", employeeId);
        params.put("payload", serializeJson(payload));
        params.put("status", "PENDING");

        try {
            client.write("attendance.outbox.insert", params);
        } catch (Exception ignored) {}
    }

    private AttendanceStatus parseStatus(Object val) {
        if (val == null) return AttendanceStatus.ABSENT;
        try {
            return AttendanceStatus.valueOf(val.toString());
        } catch (IllegalArgumentException e) {
            return AttendanceStatus.ABSENT;
        }
    }

    private int parseInteger(Object val, int fallback) {
        if (val == null) return fallback;
        if (val instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private LocalDateTime parseDateTime(Object val) {
        if (val == null) return null;
        try {
            Instant inst = Instant.parse(val.toString());
            return inst.atZone(DEFAULT_ZONE).toLocalDateTime();
        } catch (Exception ignored) {
            return null;
        }
    }

    private String serializeJson(Map<String, Object> map) {
        if (map == null || map.isEmpty()) return "{}";
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
