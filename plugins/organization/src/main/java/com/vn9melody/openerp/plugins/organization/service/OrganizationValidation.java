package com.vn9melody.openerp.plugins.organization.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import java.time.LocalDate;
import java.util.Set;
import java.util.regex.Pattern;

/** Pure validation rules for organization writes (unit-testable). */
public final class OrganizationValidation {

    private static final Set<String> STATUSES = Set.of("ACTIVE", "INACTIVE");
    private static final Pattern CODE = Pattern.compile("[A-Za-z0-9_-]{1,32}");

    private OrganizationValidation() {
    }

    public static String code(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ApiException(400, "VALIDATION_REQUIRED", field + " is required",
                java.util.Map.of("field", field));
        }
        String normalized = value.trim();
        if (!CODE.matcher(normalized).matches()) {
            throw new ApiException(400, "VALIDATION_INVALID_CODE",
                field + " must match [A-Za-z0-9_-]{1,32}",
                java.util.Map.of("field", field));
        }
        return normalized;
    }

    public static String name(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ApiException(400, "VALIDATION_REQUIRED", field + " is required",
                java.util.Map.of("field", field));
        }
        return value.trim();
    }

    public static String status(String value) {
        if (value == null || value.isBlank()) {
            return "ACTIVE";
        }
        String normalized = value.trim().toUpperCase();
        if (!STATUSES.contains(normalized)) {
            throw new ApiException(400, "VALIDATION_INVALID_STATUS",
                "status must be ACTIVE or INACTIVE", java.util.Map.of("field", "status"));
        }
        return normalized;
    }

    public static void dateRange(LocalDate from, LocalDate to) {
        if (from == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "valid_from is required",
                java.util.Map.of("field", "valid_from"));
        }
        if (to != null && to.isBefore(from)) {
            throw new ApiException(400, "VALIDATION_INVALID_DATE_RANGE",
                "valid_to must be on or after valid_from",
                java.util.Map.of("field", "valid_to"));
        }
    }
}
