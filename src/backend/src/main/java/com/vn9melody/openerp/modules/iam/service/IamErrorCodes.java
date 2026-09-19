package com.vn9melody.openerp.modules.iam.service;

/**
 * i18n response codes owned by the RBAC / data-policy APIs (DES-02-API section 6.3).
 */
public final class IamErrorCodes {

    private IamErrorCodes() {
    }

    // Permission catalog
    public static final String PERMISSION_LIST_SUCCESS = "IAM_PERMISSION_LIST_SUCCESS";
    public static final String PERMISSION_UNKNOWN = "IAM_PERMISSION_UNKNOWN";

    // Roles
    public static final String ROLE_LIST_SUCCESS = "IAM_ROLE_LIST_SUCCESS";
    public static final String ROLE_CREATED = "IAM_ROLE_CREATED";
    public static final String ROLE_UPDATED = "IAM_ROLE_UPDATED";
    public static final String ROLE_DELETED = "IAM_ROLE_DELETED";
    public static final String ROLE_IN_USE = "IAM_ROLE_IN_USE";
    public static final String ROLE_CODE_EXISTS = "IAM_ROLE_CODE_EXISTS";
    public static final String ROLE_NOT_FOUND = "IAM_ROLE_NOT_FOUND";
    public static final String SYSTEM_ROLE_IMMUTABLE = "IAM_SYSTEM_ROLE_IMMUTABLE";
    public static final String ROLE_PERMISSIONS_UPDATED = "IAM_ROLE_PERMISSIONS_UPDATED";

    // User ↔ role
    public static final String USER_LIST_SUCCESS = "IAM_USER_LIST_SUCCESS";
    public static final String USER_ROLE_LIST_SUCCESS = "IAM_USER_ROLE_LIST_SUCCESS";
    public static final String USER_ROLES_ASSIGNED = "IAM_USER_ROLES_ASSIGNED";
    public static final String USER_ROLE_REMOVED = "IAM_USER_ROLE_REMOVED";
    public static final String USER_ROLE_REQUIRED = "IAM_USER_ROLE_REQUIRED";
    public static final String USER_ROLE_NOT_FOUND = "IAM_USER_ROLE_NOT_FOUND";
    public static final String USER_NOT_FOUND = "IAM_USER_NOT_FOUND";

    // Data resources & policies
    public static final String DATA_RESOURCE_LIST_SUCCESS = "IAM_DATA_RESOURCE_LIST_SUCCESS";
    public static final String ROLE_DATA_POLICIES_SUCCESS = "IAM_ROLE_DATA_POLICIES_SUCCESS";
    public static final String ROLE_DATA_POLICIES_UPDATED = "IAM_ROLE_DATA_POLICIES_UPDATED";
    public static final String ME_DATA_SCOPES_SUCCESS = "IAM_ME_DATA_SCOPES_SUCCESS";

    // Validation
    public static final String VALIDATION_INVALID_DATA_SCOPE = "VALIDATION_INVALID_DATA_SCOPE";
}
