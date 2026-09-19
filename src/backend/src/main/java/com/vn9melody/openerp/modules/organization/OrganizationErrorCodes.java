package com.vn9melody.openerp.modules.organization;

/**
 * i18n response codes owned by the Organization module (DES-02-API section 6.2).
 * The Frontend resolves every code through its own dictionary ({@code vi.json}/{@code en.json});
 * backend never returns user-facing localised text.
 */
public final class OrganizationErrorCodes {

    private OrganizationErrorCodes() {
    }

    // Branch
    public static final String BRANCH_LIST_SUCCESS = "ORGANIZATION_BRANCH_LIST_SUCCESS";
    public static final String BRANCH_CREATED_SUCCESS = "ORGANIZATION_BRANCH_CREATED_SUCCESS";
    public static final String BRANCH_UPDATED = "ORGANIZATION_BRANCH_UPDATED";
    public static final String BRANCH_DELETED = "ORGANIZATION_BRANCH_DELETED";
    public static final String BRANCH_IN_USE = "ORGANIZATION_BRANCH_IN_USE";
    public static final String BRANCH_HAS_MEMBERS = "ORGANIZATION_BRANCH_HAS_MEMBERS";
    public static final String BRANCH_CODE_EXISTS = "ORGANIZATION_BRANCH_CODE_EXISTS";
    public static final String BRANCH_NOT_FOUND = "ORGANIZATION_BRANCH_NOT_FOUND";

    // Department
    public static final String DEPARTMENT_TREE_SUCCESS = "ORGANIZATION_DEPARTMENT_TREE_SUCCESS";
    public static final String DEPARTMENT_LIST_SUCCESS = "ORGANIZATION_DEPARTMENT_LIST_SUCCESS";
    public static final String DEPARTMENT_CREATED_SUCCESS = "ORGANIZATION_DEPARTMENT_CREATED_SUCCESS";
    public static final String DEPARTMENT_UPDATED = "ORGANIZATION_DEPARTMENT_UPDATED";
    public static final String DEPARTMENT_DELETED = "ORGANIZATION_DEPARTMENT_DELETED";
    public static final String DEPARTMENT_IN_USE = "ORGANIZATION_DEPARTMENT_IN_USE";
    public static final String DEPARTMENT_MOVED = "ORGANIZATION_DEPARTMENT_MOVED";
    public static final String DEPARTMENT_CYCLE_DETECTED = "ORGANIZATION_DEPARTMENT_CYCLE_DETECTED";
    public static final String DEPARTMENT_DEPTH_EXCEEDED = "ORGANIZATION_DEPARTMENT_DEPTH_EXCEEDED";
    public static final String DEPARTMENT_CODE_EXISTS = "ORGANIZATION_DEPARTMENT_CODE_EXISTS";
    public static final String DEPARTMENT_NOT_FOUND = "ORGANIZATION_DEPARTMENT_NOT_FOUND";

    // Membership
    public static final String MEMBERSHIP_CREATED = "ORGANIZATION_MEMBERSHIP_CREATED";
    public static final String MEMBERSHIP_LIST_SUCCESS = "ORGANIZATION_MEMBERSHIP_LIST_SUCCESS";
    public static final String MEMBERSHIP_UPDATED = "ORGANIZATION_MEMBERSHIP_UPDATED";
    public static final String MEMBERSHIP_REMOVED = "ORGANIZATION_MEMBERSHIP_REMOVED";
    public static final String MEMBERSHIP_NOT_FOUND = "ORGANIZATION_MEMBERSHIP_NOT_FOUND";
    public static final String MEMBERSHIP_BRANCH_MISMATCH = "ORGANIZATION_MEMBERSHIP_BRANCH_MISMATCH";
    public static final String MEMBERSHIP_EXISTS = "ORGANIZATION_MEMBERSHIP_EXISTS";

    // Reporting line & primary invariants
    public static final String REPORTING_CYCLE_DETECTED = "ORGANIZATION_REPORTING_CYCLE_DETECTED";
    public static final String PRIMARY_REQUIRED = "ORGANIZATION_PRIMARY_REQUIRED";

    // Branch assignments
    public static final String BRANCH_ASSIGNMENT_LIST_SUCCESS = "ORGANIZATION_BRANCH_ASSIGNMENT_LIST_SUCCESS";
    public static final String BRANCH_ASSIGNMENT_CREATED = "ORGANIZATION_BRANCH_ASSIGNMENT_CREATED";
    public static final String BRANCH_ASSIGNMENT_UPDATED = "ORGANIZATION_BRANCH_ASSIGNMENT_UPDATED";
    public static final String BRANCH_ASSIGNMENT_REMOVED = "ORGANIZATION_BRANCH_ASSIGNMENT_REMOVED";
    public static final String BRANCH_ASSIGNMENT_NOT_FOUND = "ORGANIZATION_BRANCH_ASSIGNMENT_NOT_FOUND";
    public static final String BRANCH_ASSIGNMENT_EXISTS = "ORGANIZATION_BRANCH_ASSIGNMENT_EXISTS";
    public static final String PRIMARY_BRANCH_REQUIRED = "ORGANIZATION_PRIMARY_BRANCH_REQUIRED";

    // Shared integrity codes
    public static final String CROSS_TENANT_REFERENCE = "ORGANIZATION_CROSS_TENANT_REFERENCE";

    // Validation field codes
    public static final String VALIDATION_MANAGEMENT_CYCLE_FORBIDDEN = "VALIDATION_MANAGEMENT_CYCLE_FORBIDDEN";
}
