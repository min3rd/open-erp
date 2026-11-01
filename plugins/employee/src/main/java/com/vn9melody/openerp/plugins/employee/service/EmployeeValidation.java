package com.vn9melody.openerp.plugins.employee.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ErrorCode;
import com.vn9melody.openerp.plugins.employee.api.EmployeeErrorCode;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/** Pure validation rules for employee writes (unit-testable, no DB access). */
public final class EmployeeValidation {

    private static final Set<String> STATUSES =
        Set.of("DRAFT", "PROBATION", "ACTIVE", "SUSPENDED", "LEFT", "RETIRED");
    private static final Set<String> EMPLOYEE_TYPES =
        Set.of("EMPLOYEE", "WORKER", "INTERN", "CONTRACTOR", "FREELANCER");
    private static final Set<String> ASSIGNMENT_STATUSES = Set.of("ACTIVE", "INACTIVE");
    private static final Set<String> APPROVAL_SCOPES = Set.of("TENANT", "BRANCH", "DEPARTMENT");
    private static final Set<String> APPROVER_TYPES = Set.of("ROLE", "USER", "MANAGER");
    private static final Set<String> PRIVACY_TYPES = Set.of("ACCESS", "EXPORT", "DELETE", "RECTIFY", "RESTRICT");
    private static final Set<String> PRIVACY_STATUSES =
        Set.of("RECEIVED", "IN_PROGRESS", "COMPLETED", "REJECTED");
    private static final Set<String> CONSENT_STATUSES = Set.of("GRANTED", "REVOKED", "PENDING");
    private static final Set<String> CAMPAIGN_STATUSES = Set.of("DRAFT", "ACTIVE", "CLOSED");
    private static final Set<String> CAMPAIGN_FILTER_STATUSES = Set.of("ALL", "ACTIVE");
    private static final Set<String> SCAN_STATUSES = Set.of("CLEAN", "INFECTED", "FAILED");
    private static final Pattern CODE = Pattern.compile("[A-Z0-9_-]{1,32}");
    private static final Pattern FIELD_KEY = Pattern.compile("[a-z][a-z0-9_]{0,63}");
    private static final Pattern FIELD_GROUP = Pattern.compile("[A-Z][A-Z0-9_]{0,63}");
    private static final Pattern ONBOARDING_TOKEN = Pattern.compile("[A-Za-z0-9_-]{20,128}");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private static final Set<String> CONTACT_FIELDS = Set.of(
        "phone", "personal_email", "work_email", "current_address", "permanent_address",
        "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone");
    private static final Set<String> PERSONAL_FIELDS = Set.of(
        "full_name", "photo_url", "date_of_birth", "gender", "nationality", "marital_status");
    private static final Set<String> LEGAL_FIELDS = Set.of(
        "national_id", "tax_code", "social_insurance_no", "health_insurance_no");
    private static final Set<String> EDUCATION_FIELDS =
        Set.of("education_level", "school", "major", "graduation_year");

    private static final Set<String> CHANGE_FIELDS = Set.of(
        "full_name", "photo_url", "date_of_birth", "gender", "nationality", "marital_status",
        "national_id", "tax_code", "social_insurance_no", "health_insurance_no",
        "personal_email", "work_email", "phone", "current_address", "permanent_address",
        "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone",
        "education_level", "school", "major", "graduation_year", "notes");

    private static final Set<String> SYSTEM_FIELDS = Set.of(
        "id", "tenant_id", "user_id", "employee_id", "employee_code", "status",
        "employee_type", "scope_sync_status", "created_at", "updated_at", "archived_at", "version");

    private EmployeeValidation() {
    }

    public static String employeeCode(String value) {
        if (value == null || value.isBlank()) {
            throw required("employee_code");
        }
        String normalized = value.trim().toUpperCase();
        if (!CODE.matcher(normalized).matches()) {
            throw new ApiException(400, "VALIDATION_INVALID_CODE",
                "employee_code must match [A-Z0-9_-]{1,32}", Map.of("field", "employee_code"));
        }
        return normalized;
    }

    public static String fullName(String value) {
        return requiredText(value, "full_name", 255);
    }

    public static String status(String value) {
        if (value == null || value.isBlank()) {
            return "DRAFT";
        }
        String normalized = value.trim().toUpperCase();
        if (!STATUSES.contains(normalized)) {
            throw new ApiException(400, "VALIDATION_INVALID_STATUS",
                "status is not a valid employee status", Map.of("field", "status"));
        }
        return normalized;
    }

    public static String employeeType(String value) {
        if (value == null || value.isBlank()) {
            return "EMPLOYEE";
        }
        String normalized = value.trim().toUpperCase();
        if (!EMPLOYEE_TYPES.contains(normalized)) {
            throw new ApiException(400, "VALIDATION_INVALID_TYPE",
                "employee_type is not a valid employee type", Map.of("field", "employee_type"));
        }
        return normalized;
    }

    public static String assignmentStatus(String value) {
        if (value == null || value.isBlank()) {
            return "ACTIVE";
        }
        String normalized = value.trim().toUpperCase();
        if (!ASSIGNMENT_STATUSES.contains(normalized)) {
            throw new ApiException(400, "VALIDATION_INVALID_STATUS",
                "status must be ACTIVE or INACTIVE", Map.of("field", "status"));
        }
        return normalized;
    }

    public static String statusFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if (!STATUSES.contains(normalized)) {
            throw new ApiException(400, "VALIDATION_INVALID_STATUS",
                "status is not a valid employee status", Map.of("field", "status"));
        }
        return normalized;
    }

    public static String employeeTypeFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if (!EMPLOYEE_TYPES.contains(normalized)) {
            throw new ApiException(400, "VALIDATION_INVALID_TYPE",
                "employee_type is not a valid employee type", Map.of("field", "employee_type"));
        }
        return normalized;
    }

    public static String requiredText(String value, String field, int maxLength) {
        if (value == null || value.isBlank()) {
            throw required(field);
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new ApiException(400, ErrorCode.VALIDATION_MAX,
                field + " exceeds " + maxLength + " characters", Map.of("field", field));
        }
        return normalized;
    }

    public static void dateRange(LocalDate from, LocalDate to) {
        if (from == null) {
            throw required("valid_from");
        }
        if (to != null && to.isBefore(from)) {
            throw new ApiException(400, "VALIDATION_INVALID_DATE_RANGE",
                "valid_to must be on or after valid_from", Map.of("field", "valid_to"));
        }
    }

    public static long documentSize(Long sizeBytes) {
        if (sizeBytes == null || sizeBytes <= 0) {
            throw new ApiException(400, ErrorCode.VALIDATION_MIN,
                "size_bytes must be greater than zero", Map.of("field", "size_bytes"));
        }
        return sizeBytes;
    }

    public static String fieldKey(String value) {
        if (value == null || value.isBlank() || !FIELD_KEY.matcher(value.trim()).matches()) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_FIELD_CONFIG_UNKNOWN,
                "field_key is not a known employee field", Map.of("field", "field_key"));
        }
        return value.trim();
    }

    /** Validates a self-service patch map and returns normalized keys. */
    public static Map<String, Object> selfFields(Map<String, Object> raw) {
        if (raw == null || raw.isEmpty()) {
            throw required("fields");
        }
        Map<String, Object> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : raw.entrySet()) {
            String key = entry.getKey() == null ? "" : entry.getKey().trim();
            if (SYSTEM_FIELDS.contains(key) || !EmployeeFields.isKnown(key)) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_FIELD_NOT_EDITABLE,
                    "Field is not editable by the employee", Map.of("field", key));
            }
            normalized.put(key, entry.getValue());
        }
        return normalized;
    }

    /** Validates change request keys; identity/system columns are never requestable. */
    public static Map<String, Object> changeFields(Map<String, Object> raw) {
        if (raw == null || raw.isEmpty()) {
            throw required("changes");
        }
        if (raw.size() > 50) {
            throw new ApiException(400, ErrorCode.VALIDATION_MAX,
                "changes cannot contain more than 50 fields", Map.of("field", "changes"));
        }
        Map<String, Object> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : raw.entrySet()) {
            String key = entry.getKey() == null ? "" : entry.getKey().trim();
            if (SYSTEM_FIELDS.contains(key) || !CHANGE_FIELDS.contains(key)) {
                throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_FIELD_NOT_EDITABLE,
                    "Field cannot be changed through a request", Map.of("field", key));
            }
            normalized.put(key, entry.getValue());
        }
        return normalized;
    }

    /** Invite payload uses the change allowlist; identity/system columns are never accepted. */
    public static Map<String, Object> onboardingFields(Map<String, Object> raw) {
        return changeFields(raw);
    }

    public static String approvalScopeType(String value) {
        return enumValue(value, "scope_type", APPROVAL_SCOPES,
            "scope_type must be TENANT, BRANCH or DEPARTMENT");
    }

    public static String approverType(String value) {
        return enumValue(value, "approver_type", APPROVER_TYPES,
            "approver_type must be ROLE, USER or MANAGER");
    }

    public static String fieldGroup(String value) {
        String normalized = requiredText(value, "field_group", 64).toUpperCase();
        if (!FIELD_GROUP.matcher(normalized).matches()) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_APPROVAL_CHAIN_INVALID,
                "field_group must be UPPER_SNAKE_CASE", Map.of("field", "field_group"));
        }
        return normalized;
    }

    public static int approvalStep(Integer value) {
        if (value == null || value < 1 || value > 50) {
            throw new ApiException(400, EmployeeErrorCode.EMPLOYEE_APPROVAL_CHAIN_INVALID,
                "step_no must be between 1 and 50", Map.of("field", "step_no"));
        }
        return value;
    }

    public static String privacyRequestType(String value) {
        return enumValue(value, "request_type", PRIVACY_TYPES,
            "request_type must be ACCESS, EXPORT, DELETE, RECTIFY or RESTRICT");
    }

    public static String privacyStatusFilter(String value) {
        return optionalEnum(value, "status", PRIVACY_STATUSES,
            "status must be RECEIVED, IN_PROGRESS, COMPLETED or REJECTED");
    }

    public static String consentStatus(String value) {
        return enumValue(value, "status", CONSENT_STATUSES,
            "status must be GRANTED, REVOKED or PENDING");
    }

    public static String consentPurpose(String value) {
        return requiredText(value, "purpose", 64).toUpperCase();
    }

    public static String campaignStatus(String value) {
        return enumValue(value, "status", CAMPAIGN_STATUSES,
            "status must be DRAFT, ACTIVE or CLOSED");
    }

    public static String campaignFilterStatus(String value) {
        return enumValue(value, "filter.status", CAMPAIGN_FILTER_STATUSES,
            "filter.status must be ALL or ACTIVE");
    }

    public static String scanStatus(String value) {
        return enumValue(value, "status", SCAN_STATUSES,
            "status must be CLEAN, INFECTED or FAILED");
    }

    public static String onboardingEmail(String value) {
        String email = requiredText(value, "email", 255).toLowerCase();
        if (!EMAIL.matcher(email).matches()) {
            throw new ApiException(400, ErrorCode.VALIDATION_EMAIL,
                "email is not a valid address", Map.of("field", "email"));
        }
        return email;
    }

    public static String onboardingToken(String value) {
        if (value == null || !ONBOARDING_TOKEN.matcher(value.trim()).matches()) {
            throw new ApiException(404, EmployeeErrorCode.EMPLOYEE_ONBOARDING_TOKEN_INVALID,
                "Onboarding token is invalid", Map.of());
        }
        return value.trim();
    }

    public static int onboardingExpiryHours(Integer value, int fallback) {
        int hours = value == null ? fallback : value;
        if (hours < 1 || hours > 720) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                "expires_in_hours must be between 1 and 720", Map.of("field", "expires_in_hours"));
        }
        return hours;
    }

    public static String onboardingStatusFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if (!Set.of("PENDING", "SUBMITTED", "APPROVED", "EXPIRED", "REVOKED").contains(normalized)) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                "status is not a valid onboarding invite status", Map.of("field", "status"));
        }
        return normalized;
    }

    public static String campaignStatusFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if (!CAMPAIGN_STATUSES.contains(normalized)) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                "status must be DRAFT, ACTIVE or CLOSED", Map.of("field", "status"));
        }
        return normalized;
    }

    /** Field groups used to resolve an approval chain for a set of changed fields. */
    public static Set<String> fieldGroups(Set<String> fields) {
        Set<String> groups = new java.util.LinkedHashSet<>();
        if (fields != null) {
            for (String field : fields) {
                groups.add(fieldGroupOf(field));
            }
        }
        if (groups.isEmpty()) {
            groups.add("GENERAL");
        }
        return Set.copyOf(groups);
    }

    public static String fieldGroupOf(String field) {
        if (field == null) {
            return "GENERAL";
        }
        if (CONTACT_FIELDS.contains(field)) {
            return "CONTACT";
        }
        if (PERSONAL_FIELDS.contains(field)) {
            return "PERSONAL";
        }
        if (LEGAL_FIELDS.contains(field)) {
            return "LEGAL";
        }
        if (EDUCATION_FIELDS.contains(field)) {
            return "EDUCATION";
        }
        return "GENERAL";
    }

    private static String enumValue(String value, String field, Set<String> allowed, String message) {
        if (value == null || value.isBlank()) {
            throw required(field);
        }
        String normalized = value.trim().toUpperCase();
        if (!allowed.contains(normalized)) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, message, Map.of("field", field));
        }
        return normalized;
    }

    private static String optionalEnum(String value, String field, Set<String> allowed, String message) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if (!allowed.contains(normalized)) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, message, Map.of("field", field));
        }
        return normalized;
    }

    private static ApiException required(String field) {
        return new ApiException(400, ErrorCode.VALIDATION_REQUIRED, field + " is required",
            Map.of("field", field));
    }
}
