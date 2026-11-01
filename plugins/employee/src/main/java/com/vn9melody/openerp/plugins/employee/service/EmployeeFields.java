package com.vn9melody.openerp.plugins.employee.service;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Default self-service field catalog. A tenant allowlist row
 * (plg_employee_field_config) decides the effective behaviour; this enum is the
 * seed template and a guard against arbitrary column names.
 */
public enum EmployeeFields {

    PHONE("phone", true, false, 10),
    PERSONAL_EMAIL("personal_email", true, true, 20),
    DATE_OF_BIRTH("date_of_birth", true, true, 30),
    GENDER("gender", true, false, 40),
    NATIONALITY("nationality", true, false, 50),
    MARITAL_STATUS("marital_status", true, false, 60),
    CURRENT_ADDRESS("current_address", true, false, 70),
    PERMANENT_ADDRESS("permanent_address", true, false, 80),
    EMERGENCY_CONTACT_NAME("emergency_contact_name", true, false, 90),
    EMERGENCY_CONTACT_RELATIONSHIP("emergency_contact_relationship", true, false, 100),
    EMERGENCY_CONTACT_PHONE("emergency_contact_phone", true, false, 110),
    EDUCATION_LEVEL("education_level", true, true, 120),
    SCHOOL("school", true, true, 130),
    MAJOR("major", true, true, 140),
    GRADUATION_YEAR("graduation_year", true, true, 150);

    private static final Map<String, EmployeeFields> BY_KEY = Arrays.stream(values())
        .collect(Collectors.toUnmodifiableMap(EmployeeFields::key, Function.identity()));

    private final String key;
    private final boolean editableByDefault;
    private final boolean requiresApprovalByDefault;
    private final int sortOrder;

    EmployeeFields(String key, boolean editableByDefault, boolean requiresApprovalByDefault, int sortOrder) {
        this.key = key;
        this.editableByDefault = editableByDefault;
        this.requiresApprovalByDefault = requiresApprovalByDefault;
        this.sortOrder = sortOrder;
    }

    public String key() {
        return key;
    }

    public boolean editableByDefault() {
        return editableByDefault;
    }

    public boolean requiresApprovalByDefault() {
        return requiresApprovalByDefault;
    }

    public int sortOrder() {
        return sortOrder;
    }

    public static EmployeeFields fromKey(String key) {
        return key == null ? null : BY_KEY.get(key);
    }

    public static boolean isKnown(String key) {
        return BY_KEY.containsKey(key);
    }
}
