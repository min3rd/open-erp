package com.vn9melody.openerp.plugins.attendance.model;

import java.time.LocalTime;

/**
 * Shift definition semantics per ADR-S09-001 (catalog SHIFT stays a display
 * label; this record owns the time structure including night shifts).
 */
public record ShiftDef(
        String code,
        String name,
        LocalTime startTime,
        LocalTime endTime,
        int graceInMinutes,
        int graceOutMinutes,
        int breakMinutes,
        int otGraceMinutes,
        int minOtMinutes,
        int workingMinutes) {

    public ShiftDef {
        if (workingMinutes <= 0) {
            throw new IllegalArgumentException("working_minutes must be positive");
        }
        if (graceInMinutes < 0 || graceOutMinutes < 0 || breakMinutes < 0
                || otGraceMinutes < 0 || minOtMinutes < 0) {
            throw new IllegalArgumentException("tolerances must be non-negative");
        }
    }

    /** Night shift when end is not after start (crosses midnight, BR-A07). */
    public boolean crossesMidnight() {
        return !endTime.isAfter(startTime);
    }
}
