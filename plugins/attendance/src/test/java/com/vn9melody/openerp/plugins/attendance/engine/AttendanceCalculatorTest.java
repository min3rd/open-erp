package com.vn9melody.openerp.plugins.attendance.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.plugins.attendance.model.AttendanceStatus;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.CalcInput;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.CalcResult;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.LogEntry;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.OtWindow;
import com.vn9melody.openerp.plugins.attendance.model.ShiftDef;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Boundary suite per ADR-S09-003 §4 (pure formula, no DB). */
class AttendanceCalculatorTest {

    private static final LocalDate D = LocalDate.of(2026, 11, 2);
    private static final UUID EMP = UUID.randomUUID();

    private static ShiftDef dayShift() {
        return new ShiftDef("CA_SANG", "Ca sáng", LocalTime.of(8, 0), LocalTime.of(17, 0),
                10, 10, 60, 15, 30, 480);
    }

    private static ShiftDef nightShift() {
        return new ShiftDef("CA_DEM", "Ca đêm", LocalTime.of(22, 0), LocalTime.of(6, 0),
                10, 10, 60, 15, 30, 480);
    }

    private static LogEntry in(int day, int hour, int minute) {
        return new LogEntry(UUID.randomUUID(), D.atTime(hour, minute), true, "WEB");
    }

    private static LogEntry out(int day, int hour, int minute) {
        return new LogEntry(UUID.randomUUID(), D.atTime(hour, minute), false, "WEB");
    }

    private static LogEntry nightIn(int hour, int minute) {
        return new LogEntry(UUID.randomUUID(), D.atTime(hour, minute), true, "KIOSK");
    }

    private static LogEntry nightOutNextDay(int hour, int minute) {
        return new LogEntry(UUID.randomUUID(), D.plusDays(1).atTime(hour, minute), false, "KIOSK");
    }

    private static CalcResult calc(ShiftDef shift, List<LogEntry> logs, List<OtWindow> ot) {
        return AttendanceCalculator.calculate(
                new CalcInput(D, shift, shift == null ? null : shift.name(), logs, ot, false, null));
    }

    @Test
    void noShiftNoLogsNoRecord() {
        assertFalse(calc(null, List.of(), List.of()).createRecord());
    }

    @Test
    void holidayNoShiftNoLogsNoRecord() {
        CalcResult r = AttendanceCalculator.calculate(
                new CalcInput(D, null, null, List.of(), List.of(), true, null));
        assertFalse(r.createRecord());
    }

    @Test
    void noShiftWithLogsNeedsReview() {
        CalcResult r = calc(null, List.of(in(2, 9, 0)), List.of());
        assertTrue(r.createRecord());
        assertEquals(AttendanceStatus.PRESENT, r.status());
        assertTrue(r.needsReview());
        assertEquals("NO_SHIFT_ASSIGNED", r.reviewNote());
    }

    @Test
    void shiftNoLogsAbsent() {
        CalcResult r = calc(dayShift(), List.of(), List.of());
        assertEquals(AttendanceStatus.ABSENT, r.status());
        assertFalse(r.needsReview());
    }

    @Test
    void onTimeFullDayPresentNoLate() {
        CalcResult r = calc(dayShift(), List.of(in(2, 7, 55), out(2, 17, 5)), List.of());
        assertEquals(AttendanceStatus.PRESENT, r.status());
        assertEquals(0, r.lateMinutes());
        assertEquals(0, r.earlyLeaveMinutes());
        assertEquals(490, r.workedMinutes());
    }

    @Test
    void lateBeyondGraceCounted() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 25), out(2, 17, 0)), List.of());
        assertEquals(15, r.lateMinutes());
    }

    @Test
    void lateWithinGraceNotCounted() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 5), out(2, 17, 0)), List.of());
        assertEquals(0, r.lateMinutes());
    }

    @Test
    void earlyLeaveBeyondGraceCounted() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 16, 30)), List.of());
        assertEquals(20, r.earlyLeaveMinutes());
    }

    @Test
    void earlyLeaveWithinGraceNotCounted() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 16, 55)), List.of());
        assertEquals(0, r.earlyLeaveMinutes());
    }

    @Test
    void breakMinutesDeducted() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 17, 0)), List.of());
        assertEquals(480, r.workedMinutes());
    }

    @Test
    void workedBelowHalfIsHalfDay() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 11, 0)), List.of());
        assertEquals(AttendanceStatus.HALF_DAY, r.status());
    }

    @Test
    void workedExactlyHalfKeepsPresent() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 13, 0)), List.of());
        assertEquals(AttendanceStatus.PRESENT, r.status());
    }

    @Test
    void checkinWithoutCheckoutNeedsReview() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0)), List.of());
        assertEquals(AttendanceStatus.PRESENT, r.status());
        assertTrue(r.needsReview());
        assertEquals("OPEN_CHECKIN", r.reviewNote());
        assertNull(r.effectiveOut());
    }

    @Test
    void onlyOutLogsAbsentNeedsReview() {
        CalcResult r = calc(dayShift(), List.of(out(2, 17, 0)), List.of());
        assertEquals(AttendanceStatus.ABSENT, r.status());
        assertTrue(r.needsReview());
        assertEquals("OUT_WITHOUT_IN", r.reviewNote());
    }

    @Test
    void otInsideWindowCounted() {
        List<OtWindow> windows = List.of(new OtWindow(D.atTime(17, 0), D.atTime(19, 0)));
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 19, 0)), windows);
        assertEquals(105, r.otMinutes());
    }

    @Test
    void otOutsideWindowIgnored() {
        List<OtWindow> windows = List.of(new OtWindow(D.atTime(17, 0), D.atTime(18, 0)));
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 20, 0)), windows);
        assertEquals(45, r.otMinutes());
    }

    @Test
    void otBelowThresholdZero() {
        List<OtWindow> windows = List.of(new OtWindow(D.atTime(17, 0), D.atTime(17, 40)));
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 17, 40)), windows);
        assertEquals(0, r.otMinutes());
    }

    @Test
    void otGraceSubtracted() {
        List<OtWindow> windows = List.of(new OtWindow(D.atTime(17, 0), D.atTime(18, 30)));
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 18, 30)), windows);
        assertEquals(75, r.otMinutes());
    }

    @Test
    void otNotCountedForHalfDay() {
        List<OtWindow> windows = List.of(new OtWindow(D.atTime(10, 0), D.atTime(12, 0)));
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 11, 0)), windows);
        assertEquals(AttendanceStatus.HALF_DAY, r.status());
        assertEquals(0, r.otMinutes());
    }

    @Test
    void multiplePairsUseFirstInLastOut() {
        CalcResult r = calc(dayShift(),
                List.of(in(2, 8, 0), out(2, 12, 0), in(2, 13, 0), out(2, 17, 0)), List.of());
        assertEquals(480, r.workedMinutes());
        assertEquals(D.atTime(8, 0), r.effectiveIn().toLocalTime().atDate(D));
        assertEquals(D.atTime(17, 0), r.effectiveOut().toLocalTime().atDate(D));
    }

    @Test
    void nightShiftCrossesMidnightPairing() {
        List<LogEntry> logs = List.of(nightIn(21, 55), nightOutNextDay(6, 5));
        CalcResult r = AttendanceCalculator.calculate(new CalcInput(D, nightShift(), "Ca đêm",
                logs, List.of(), false, null));
        assertEquals(AttendanceStatus.PRESENT, r.status());
        assertEquals(430, r.workedMinutes());
        assertEquals(0, r.lateMinutes());
    }

    @Test
    void nightShiftLateCountedFromWorkDate() {
        List<LogEntry> logs = List.of(nightIn(22, 30), nightOutNextDay(6, 0));
        CalcResult r = AttendanceCalculator.calculate(new CalcInput(D, nightShift(), "Ca đêm",
                logs, List.of(), false, null));
        assertEquals(20, r.lateMinutes());
    }

    @Test
    void forcedOnLeaveSkipsTimeCalc() {
        CalcResult r = AttendanceCalculator.calculate(new CalcInput(D, dayShift(), "Ca sáng",
                List.of(in(2, 8, 0), out(2, 17, 0)), List.of(), false, AttendanceStatus.ON_LEAVE));
        assertEquals(AttendanceStatus.ON_LEAVE, r.status());
        assertEquals(0, r.workedMinutes());
        assertFalse(r.needsReview());
    }

    @Test
    void holidayWithLogsStillComputes() {
        CalcResult r = AttendanceCalculator.calculate(new CalcInput(D, dayShift(), "Ca sáng",
                List.of(in(2, 8, 0), out(2, 17, 0)), List.of(), true, null));
        assertEquals(AttendanceStatus.PRESENT, r.status());
        assertEquals(480, r.workedMinutes());
    }

    @Test
    void halfThresholdBoundary() {
        assertEquals(240, AttendanceCalculator.halfThreshold(480));
        assertEquals(241, AttendanceCalculator.halfThreshold(481));
    }

    @Test
    void zeroWorkedWithLogsFlagsReview() {
        CalcResult r = calc(dayShift(), List.of(in(2, 8, 0), out(2, 8, 5)), List.of());
        assertEquals(AttendanceStatus.ABSENT, r.status());
        assertTrue(r.needsReview());
    }
}
