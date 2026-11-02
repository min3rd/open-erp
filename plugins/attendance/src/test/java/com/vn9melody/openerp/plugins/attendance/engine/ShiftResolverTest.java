package com.vn9melody.openerp.plugins.attendance.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.plugins.attendance.engine.ShiftResolver.ResolverInput;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.DayAssignment;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.ShiftResolution;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.WeekTemplate;
import com.vn9melody.openerp.plugins.attendance.model.ShiftDef;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Precedence suite per ADR-S09-001 (holiday → assignment → dept → branch → tenant → default). */
class ShiftResolverTest {

    private static final LocalDate D = LocalDate.of(2026, 11, 2);
    private static final ShiftDef MORNING = new ShiftDef("CA_SANG", "Ca sáng",
            LocalTime.of(8, 0), LocalTime.of(17, 0), 10, 10, 60, 15, 30, 480);
    private static final ShiftDef NIGHT = new ShiftDef("CA_DEM", "Ca đêm",
            LocalTime.of(22, 0), LocalTime.of(6, 0), 10, 10, 60, 15, 30, 480);
    private static final Map<String, ShiftDef> LIBRARY = Map.of("CA_SANG", MORNING, "CA_DEM", NIGHT);

    private static WeekTemplate week(String scopeType, LocalDate from, String... days) {
        DayOfWeek[] dow = {DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY};
        Map<DayOfWeek, String> map = new java.util.HashMap<>();
        for (int i = 0; i < 7; i++) {
            map.put(dow[i], i < days.length ? days[i] : "OFF");
        }
        return new WeekTemplate(scopeType, null, from, null, map);
    }

    private static ResolverInput input(boolean holiday, DayAssignment assignment,
            List<WeekTemplate> dept, List<WeekTemplate> branch, List<WeekTemplate> tenant,
            String defaultCode) {
        return new ResolverInput(D, holiday, assignment, dept, branch, tenant, defaultCode, LIBRARY);
    }

    @Test
    void assignmentOverrideWins() {
        ShiftResolution r = ShiftResolver.resolve(input(false, new DayAssignment("CA_DEM"),
                List.of(week("DEPARTMENT", D.minusDays(1), "CA_SANG")),
                List.of(), List.of(), null));
        assertEquals("CA_DEM", r.shift().code());
        assertEquals("ASSIGNMENT", r.source());
    }

    @Test
    void assignmentExplicitOffWins() {
        ShiftResolution r = ShiftResolver.resolve(input(false, new DayAssignment("OFF"),
                List.of(week("DEPARTMENT", D.minusDays(1), "CA_SANG")),
                List.of(), List.of(), "CA_SANG"));
        assertNull(r.shift());
        assertEquals("ASSIGNMENT", r.source());
    }

    @Test
    void departmentBeatsBranch() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(week("DEPARTMENT", D.minusDays(1), "CA_SANG")),
                List.of(week("BRANCH", D.minusDays(1), "CA_DEM")),
                List.of(), null));
        assertEquals("CA_SANG", r.shift().code());
        assertEquals("DEPARTMENT", r.source());
    }

    @Test
    void branchBeatsTenant() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(),
                List.of(week("BRANCH", D.minusDays(1), "CA_DEM")),
                List.of(week("TENANT", D.minusDays(1), "CA_SANG")),
                null));
        assertEquals("CA_DEM", r.shift().code());
        assertEquals("BRANCH", r.source());
    }

    @Test
    void tenantTemplateUsedWhenNoHigherScope() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(), List.of(),
                List.of(week("TENANT", D.minusDays(1), "CA_SANG")),
                null));
        assertEquals("CA_SANG", r.shift().code());
        assertEquals("TENANT", r.source());
    }

    @Test
    void defaultShiftWhenNoTemplates() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(), List.of(), List.of(), "CA_SANG"));
        assertEquals("CA_SANG", r.shift().code());
        assertEquals("DEFAULT", r.source());
    }

    @Test
    void noConfigAtAllResolvesNone() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(), List.of(), List.of(), null));
        assertNull(r.shift());
        assertEquals("NONE", r.source());
    }

    @Test
    void holidayBeatsEverything() {
        ShiftResolution r = ShiftResolver.resolve(input(true, new DayAssignment("CA_DEM"),
                List.of(week("DEPARTMENT", D.minusDays(1), "CA_SANG")),
                List.of(), List.of(), "CA_SANG"));
        assertNull(r.shift());
        assertEquals("HOLIDAY", r.source());
    }

    @Test
    void effectiveFromAfterDateIgnored() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(week("DEPARTMENT", D.plusDays(1), "CA_SANG")),
                List.of(),
                List.of(week("TENANT", D.minusDays(1), "CA_DEM")),
                null));
        assertEquals("CA_DEM", r.shift().code());
    }

    @Test
    void effectiveToBoundaryHonored() {
        WeekTemplate expired = new WeekTemplate("DEPARTMENT", null, D.minusDays(10),
                D.minusDays(1), Map.of(DayOfWeek.MONDAY, "CA_SANG"));
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(expired), List.of(),
                List.of(week("TENANT", D.minusDays(1), "CA_DEM")),
                null));
        assertEquals("CA_DEM", r.shift().code());
    }

    @Test
    void latestEffectiveTemplateWins() {
        WeekTemplate older = week("DEPARTMENT", D.minusDays(10), "CA_DEM");
        WeekTemplate newer = week("DEPARTMENT", D.minusDays(1), "CA_SANG");
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(older, newer), List.of(), List.of(), null));
        assertEquals("CA_SANG", r.shift().code());
    }

    @Test
    void unknownShiftCodeFallsThrough() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(week("DEPARTMENT", D.minusDays(1), "CA_KHONG_TON_TAI")),
                List.of(),
                List.of(week("TENANT", D.minusDays(1), "CA_SANG")),
                null));
        assertEquals("CA_SANG", r.shift().code());
    }

    @Test
    void offDayInTemplateResolvesNone() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(week("DEPARTMENT", D.minusDays(1), "OFF")),
                List.of(), List.of(), "CA_SANG"));
        assertNull(r.shift());
        assertEquals("DEPARTMENT", r.source());
    }

    @Test
    void shiftLibraryOnlyActiveCodesResolve() {
        ShiftResolution r = ShiftResolver.resolve(input(false, null,
                List.of(), List.of(), List.of(), "CA_OFF_KHONG_CO"));
        assertNull(r.shift());
        assertTrue(r.source().equals("DEFAULT"));
    }
}
