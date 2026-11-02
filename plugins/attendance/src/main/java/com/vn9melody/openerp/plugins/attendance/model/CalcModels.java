package com.vn9melody.openerp.plugins.attendance.model;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Value objects shared by the pure engines (ADR-S09-001/003). */
public final class CalcModels {

    private CalcModels() {}

    /** Raw punch event, append-only source of truth. */
    public record LogEntry(UUID id, LocalDateTime at, boolean checkIn, String source) {}

    /** Approved overtime window (only from an approved OVERTIME request). */
    public record OtWindow(LocalDateTime start, LocalDateTime end) {
        public OtWindow {
            if (start == null || end == null || !end.isAfter(start)) {
                throw new IllegalArgumentException("ot window must satisfy end > start");
            }
        }

        public long overlapMinutes(LocalDateTime from, LocalDateTime to) {
            LocalDateTime s = start.isAfter(from) ? start : from;
            LocalDateTime e = end.isBefore(to) ? end : to;
            return e.isAfter(s) ? java.time.Duration.between(s, e).toMinutes() : 0;
        }
    }

    /**
     * Weekly template: day → shift code or "OFF". Scope resolution order is
     * assignment → department → branch → tenant → default (ADR-S09-001).
     */
    public record WeekTemplate(String scopeType, UUID scopeId, LocalDate effectiveFrom,
                               LocalDate effectiveTo, Map<DayOfWeek, String> week) {
        public boolean covers(LocalDate date) {
            return !date.isBefore(effectiveFrom)
                    && (effectiveTo == null || !date.isAfter(effectiveTo));
        }
    }

    /** Per-day override row (HR or approved SHIFT_SWAP). Null shiftCode = explicit OFF. */
    public record DayAssignment(String shiftCode) {}

    /** Result of resolving the shift for one employee-day; empty shift = no shift. */
    public record ShiftResolution(ShiftDef shift, String source) {
        public static ShiftResolution none(String source) {
            return new ShiftResolution(null, source);
        }
    }

    /** Everything the calculator needs for one employee-day (pure, no DB). */
    public record CalcInput(
            LocalDate workDate,
            ShiftDef shift,
            String shiftName,
            List<LogEntry> logs,
            List<OtWindow> otWindows,
            boolean isHoliday,
            AttendanceStatus forcedStatus) {
    }

    /** Computed daily record; createRecord=false means the day needs no row. */
    public record CalcResult(
            boolean createRecord,
            AttendanceStatus status,
            LocalDateTime effectiveIn,
            LocalDateTime effectiveOut,
            int workedMinutes,
            int lateMinutes,
            int earlyLeaveMinutes,
            int otMinutes,
            boolean needsReview,
            String reviewNote) {
    }
}
