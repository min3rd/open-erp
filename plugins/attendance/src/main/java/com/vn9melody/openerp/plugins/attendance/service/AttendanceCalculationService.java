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
        persistRecord(employeeId, workDate, shift, shiftName, result, existingRecord);

        // If needs review, publish outbox event
        if (result.needsReview()) {
            publishNeedsReviewEvent(employeeId, workDate, result);
        }

        return result;
    }

    /**
     * Recalculates every employee-day that has logs or a shift assignment in the
     * range. Idempotent: existing records are updated, manual overrides kept.
     */
    public int recalculateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            return 0;
        }
        Map<UUID, String> shiftCodeById = new LinkedHashMap<>();
        Map<String, ShiftDef> library = loadShiftLibrary(shiftCodeById);
        String defaultShiftCode = loadDefaultShiftCode(shiftCodeById);
        Map<String, Map<String, Object>> existing = loadExistingRecords(from, to);

        int calculated = 0;
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            Map<UUID, List<LogEntry>> logsByEmployee = loadLogsByEmployee(date);
            Map<UUID, String> assignments = loadAssignments(date, shiftCodeById);
            Set<UUID> employees = new LinkedHashSet<>(logsByEmployee.keySet());
            employees.addAll(assignments.keySet());

            for (UUID employeeId : employees) {
                List<LogEntry> logs = logsByEmployee.getOrDefault(employeeId, List.of());
                String assignedCode = assignments.get(employeeId);
                ShiftResolution resolution = ShiftResolver.resolve(new ShiftResolver.ResolverInput(
                        date,
                        false,
                        assignedCode != null ? new DayAssignment(assignedCode) : null,
                        List.of(), List.of(), List.of(),
                        defaultShiftCode,
                        library));
                if (logs.isEmpty() && resolution.shift() == null) {
                    continue;
                }
                calculateDay(employeeId, date, resolution, logs, List.of(), false,
                        existing.get(employeeId + "|" + date), 0);
                calculated++;
            }
        }
        return calculated;
    }

    private Map<String, ShiftDef> loadShiftLibrary(Map<UUID, String> codeById) {
        Map<String, ShiftDef> library = new LinkedHashMap<>();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("is_active", true);
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.shift.list", params, 100)) {
            String code = asString(row.get("code"));
            if (code == null) {
                continue;
            }
            UUID id = asUuid(row.get("id"));
            if (id != null) {
                codeById.put(id, code);
            }
            try {
                library.put(code, new ShiftDef(
                        code,
                        asString(row.get("name")),
                        asTime(row.get("start_time")),
                        asTime(row.get("end_time")),
                        asInt(row.get("grace_in_minutes"), 0),
                        asInt(row.get("grace_out_minutes"), 0),
                        asInt(row.get("break_minutes"), 0),
                        asInt(row.get("ot_grace_minutes"), 0),
                        asInt(row.get("min_ot_minutes"), 0),
                        asInt(row.get("working_minutes"), 480)));
            } catch (RuntimeException ignored) {
                // Incomplete shift definition: leave it out of the library.
            }
        }
        return library;
    }

    private String loadDefaultShiftCode(Map<UUID, String> codeById) {
        try {
            Map<String, Object> row = client.query("attendance.settings.get", Map.of()).first();
            UUID id = asUuid(row.get("default_shift_definition_id"));
            return id != null ? codeById.get(id) : null;
        } catch (RuntimeException e) {
            return null;
        }
    }

    private Map<String, Map<String, Object>> loadExistingRecords(LocalDate from, LocalDate to) {
        Map<String, Map<String, Object>> byDay = new LinkedHashMap<>();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("from", from.toString());
        params.put("to", to.toString());
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.record.list_range", params, 1000)) {
            String employeeId = asString(row.get("employee_id"));
            String workDate = asString(row.get("work_date"));
            if (employeeId != null && workDate != null) {
                byDay.put(employeeId + "|" + workDate, row);
            }
        }
        return byDay;
    }

    private Map<UUID, List<LogEntry>> loadLogsByEmployee(LocalDate date) {
        Map<UUID, List<LogEntry>> byEmployee = new LinkedHashMap<>();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("from", date.toString());
        params.put("to", date.toString());
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.log.list", params, 200)) {
            UUID employeeId = asUuid(row.get("employee_id"));
            Instant occurredAt = asInstant(row.get("occurred_at"));
            if (employeeId == null || occurredAt == null) {
                continue;
            }
            boolean checkIn = "IN".equalsIgnoreCase(asString(row.get("event_type")));
            byEmployee.computeIfAbsent(employeeId, k -> new ArrayList<>())
                    .add(new LogEntry(asUuid(row.get("id")), occurredAt.atZone(DEFAULT_ZONE).toLocalDateTime(),
                            checkIn, asString(row.get("source"))));
        }
        byEmployee.values().forEach(list -> list.sort(Comparator.comparing(LogEntry::at)));
        return byEmployee;
    }

    private Map<UUID, String> loadAssignments(LocalDate date, Map<UUID, String> codeById) {
        Map<UUID, String> byEmployee = new LinkedHashMap<>();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("work_date", date.toString());
        for (Map<String, Object> row : PluginDataPager.listAll(client, "attendance.assignment.list_by_date", params, 500)) {
            UUID employeeId = asUuid(row.get("employee_id"));
            UUID shiftId = asUuid(row.get("shift_definition_id"));
            if (employeeId == null) {
                continue;
            }
            byEmployee.put(employeeId, shiftId != null ? codeById.get(shiftId) : null);
        }
        return byEmployee;
    }

    private String asString(Object value) {
        return value != null ? value.toString() : null;
    }

    private UUID asUuid(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private int asInt(Object value, int fallback) {
        if (value instanceof Number n) {
            return n.intValue();
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

    private java.time.LocalTime asTime(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString();
        return java.time.LocalTime.parse(text.length() > 8 ? text.substring(0, 8) : text);
    }

    private Instant asInstant(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Instant.parse(value.toString());
        } catch (Exception e) {
            return null;
        }
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

    private void persistRecord(UUID employeeId, LocalDate workDate, ShiftDef shift, String shiftName,
                               CalcResult result, Map<String, Object> existingRecord) {
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
        params.put("updated_at", Instant.now().toString());

        Object existingId = existingRecord != null ? existingRecord.get("id") : null;
        if (existingId != null) {
            params.put("id", existingId);
            client.write("attendance.record.recalc_update", params);
        } else {
            client.write("attendance.record.upsert", params);
        }
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
