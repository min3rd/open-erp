package com.vn9melody.openerp.plugins.attendance.engine;

import com.vn9melody.openerp.plugins.attendance.model.CalcModels.DayAssignment;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.ShiftResolution;
import com.vn9melody.openerp.plugins.attendance.model.CalcModels.WeekTemplate;
import com.vn9melody.openerp.plugins.attendance.model.ShiftDef;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Resolves the effective shift for one employee-day with the precedence
 * holiday → assignment override → department → branch → tenant → default
 * (ADR-S09-001). Pure function, no persistence dependency.
 */
public final class ShiftResolver {

    public record ResolverInput(
            LocalDate workDate,
            boolean isHoliday,
            DayAssignment assignment,
            List<WeekTemplate> departmentTemplates,
            List<WeekTemplate> branchTemplates,
            List<WeekTemplate> tenantTemplates,
            String defaultShiftCode,
            Map<String, ShiftDef> shiftLibrary) {
    }

    private ShiftResolver() {}

    public static ShiftResolution resolve(ResolverInput in) {
        if (in.isHoliday()) {
            return ShiftResolution.none("HOLIDAY");
        }
        if (in.assignment() != null) {
            return fromCode(in.assignment().shiftCode(), in.shiftLibrary(), "ASSIGNMENT")
                    .orElse(ShiftResolution.none("ASSIGNMENT"));
        }
        Optional<ShiftResolution> fromTemplate = fromTemplates(in.departmentTemplates(), in.workDate(),
                in.shiftLibrary(), "DEPARTMENT");
        if (fromTemplate.isPresent()) {
            return fromTemplate.get();
        }
        fromTemplate = fromTemplates(in.branchTemplates(), in.workDate(), in.shiftLibrary(), "BRANCH");
        if (fromTemplate.isPresent()) {
            return fromTemplate.get();
        }
        fromTemplate = fromTemplates(in.tenantTemplates(), in.workDate(), in.shiftLibrary(), "TENANT");
        if (fromTemplate.isPresent()) {
            return fromTemplate.get();
        }
        if (in.defaultShiftCode() != null) {
            return fromCode(in.defaultShiftCode(), in.shiftLibrary(), "DEFAULT")
                    .orElse(ShiftResolution.none("DEFAULT"));
        }
        return ShiftResolution.none("NONE");
    }

    private static Optional<ShiftResolution> fromTemplates(List<WeekTemplate> templates, LocalDate date,
            Map<String, ShiftDef> library, String source) {
        if (templates == null) {
            return Optional.empty();
        }
        return templates.stream()
                .filter(t -> t.covers(date))
                .max((a, b) -> a.effectiveFrom().compareTo(b.effectiveFrom()))
                .map(WeekTemplate::week)
                .map(week -> week.get(date.getDayOfWeek()))
                .flatMap(code -> {
                    if (code == null) {
                        return Optional.<ShiftResolution>empty();
                    }
                    if ("OFF".equals(code)) {
                        return Optional.of(ShiftResolution.none(source));
                    }
                    return fromCode(code, library, source);
                });
    }

    private static Optional<ShiftResolution> fromCode(String code, Map<String, ShiftDef> library,
            String source) {
        if (code == null || "OFF".equals(code)) {
            return Optional.empty();
        }
        ShiftDef def = library.get(code);
        if (def == null) {
            return Optional.empty();
        }
        return Optional.of(new ShiftResolution(def, source));
    }
}
