package com.vn9melody.openerp.plugins.attendance.engine;

import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.CalcInput;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.CalcResult;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.LogEntry;
import com.vn9melody.openerp.plugins.attendance.model.ShiftDef;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Pure daily-attendance formula per ADR-S09-003: pair first check-in with the
 * last check-out, apply two-sided shift tolerances (grace in favour of the
 * employee; OT grace/threshold in favour of the company), count OT only inside
 * approved windows and only for full presence.
 */
public final class AttendanceCalculator {

    private AttendanceCalculator() {}

    public static CalcResult calculate(CalcInput in) {
        if (in.forcedStatus() != null) {
            return new CalcResult(true, in.forcedStatus(), null, null, 0, 0, 0, 0, false, null);
        }
        if (in.shift() == null) {
            if (in.logs().isEmpty()) {
                return new CalcResult(false, null, null, null, 0, 0, 0, 0, false, null);
            }
            LogEntry first = in.logs().stream()
                    .filter(LogEntry::checkIn)
                    .min(Comparator.comparing(LogEntry::at))
                    .orElse(null);
            LocalDateTime effectiveIn = first == null ? null : first.at();
            return new CalcResult(true, AttendanceStatus.PRESENT, effectiveIn, null,
                    0, 0, 0, 0, true, "NO_SHIFT_ASSIGNED");
        }

        ShiftDef shift = in.shift();
        LocalDateTime windowStart = LocalDateTime.of(in.workDate(), shift.startTime());
        LocalDateTime windowEnd = shift.crossesMidnight()
                ? LocalDateTime.of(in.workDate().plusDays(1), shift.endTime())
                : LocalDateTime.of(in.workDate(), shift.endTime());

        List<LogEntry> logs = in.logs().stream()
                .sorted(Comparator.comparing(LogEntry::at))
                .toList();
        LogEntry firstIn = logs.stream().filter(LogEntry::checkIn).findFirst().orElse(null);
        LogEntry lastOut = logs.stream()
                .filter(l -> !l.checkIn())
                .filter(l -> firstIn == null || l.at().isAfter(firstIn.at()))
                .reduce((a, b) -> b)
                .orElse(null);

        if (firstIn == null) {
            return new CalcResult(true, AttendanceStatus.ABSENT, null, null, 0, 0, 0, 0,
                    !logs.isEmpty(), logs.isEmpty() ? null : "OUT_WITHOUT_IN");
        }
        if (lastOut == null) {
            return new CalcResult(true, AttendanceStatus.PRESENT, firstIn.at(), null,
                    0, 0, 0, 0, true, "OPEN_CHECKIN");
        }

        long late = Duration.between(windowStart.plusMinutes(shift.graceInMinutes()), firstIn.at())
                .toMinutes();
        late = Math.max(0, late);
        long early = Duration.between(lastOut.at(), windowEnd.minusMinutes(shift.graceOutMinutes()))
                .toMinutes();
        early = Math.max(0, early);
        long worked = Duration.between(firstIn.at(), lastOut.at()).toMinutes() - shift.breakMinutes();
        worked = Math.max(0, worked);

        AttendanceStatus status;
        boolean needsReview = false;
        if (worked <= 0) {
            status = AttendanceStatus.ABSENT;
            needsReview = true;
        } else if (worked >= halfThreshold(shift.workingMinutes())) {
            status = AttendanceStatus.PRESENT;
        } else {
            status = AttendanceStatus.HALF_DAY;
        }

        long ot = 0;
        if (status == AttendanceStatus.PRESENT && in.otWindows() != null
                && !in.otWindows().isEmpty()) {
            long overlap = in.otWindows().stream()
                    .mapToLong(w -> w.overlapMinutes(firstIn.at(), lastOut.at()))
                    .sum();
            ot = Math.max(0, overlap - shift.otGraceMinutes());
            if (ot < shift.minOtMinutes()) {
                ot = 0;
            }
        }

        return new CalcResult(true, status, firstIn.at(), lastOut.at(),
                (int) worked, (int) late, (int) early, (int) ot, needsReview, null);
    }

    /** Half-day boundary: at least half the standard working minutes keeps PRESENT. */
    static int halfThreshold(int workingMinutes) {
        return (workingMinutes + 1) / 2;
    }
}
