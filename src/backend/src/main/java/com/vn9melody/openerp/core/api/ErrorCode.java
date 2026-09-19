package com.vn9melody.openerp.core.api;

public final class ErrorCode {
    private ErrorCode() {}

    // Auth Success
    public static final String AUTH_REGISTER_SUCCESS = "AUTH_REGISTER_SUCCESS";
    public static final String AUTH_EMAIL_VERIFIED_SUCCESS = "AUTH_EMAIL_VERIFIED_SUCCESS";
    public static final String AUTH_BUSINESS_REGISTER_SUCCESS = "AUTH_BUSINESS_REGISTER_SUCCESS";
    public static final String AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS";
    public static final String AUTH_SELECT_TENANT_REQUIRED = "AUTH_SELECT_TENANT_REQUIRED";
    public static final String AUTH_2FA_REQUIRED = "AUTH_2FA_REQUIRED";
    public static final String AUTH_FORGOT_PASSWORD_REQUESTED = "AUTH_FORGOT_PASSWORD_REQUESTED";
    public static final String AUTH_PASSWORD_RESET_SUCCESS = "AUTH_PASSWORD_RESET_SUCCESS";
    public static final String AUTH_LOGOUT_SUCCESS = "AUTH_LOGOUT_SUCCESS";
    public static final String AUTH_TOKEN_REFRESH_SUCCESS = "AUTH_TOKEN_REFRESH_SUCCESS";
    public static final String AUTH_VERIFICATION_EMAIL_RESENT = "AUTH_VERIFICATION_EMAIL_RESENT";

    // Auth Errors
    public static final String AUTH_EMAIL_ALREADY_EXISTS = "AUTH_EMAIL_ALREADY_EXISTS";
    public static final String AUTH_TENANT_SLUG_DUPLICATE = "AUTH_TENANT_SLUG_DUPLICATE";
    public static final String AUTH_TENANT_SLUG_AVAILABLE = "AUTH_TENANT_SLUG_AVAILABLE";
    public static final String AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS";
    public static final String AUTH_ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED";
    public static final String AUTH_OTP_INVALID_OR_EXPIRED = "AUTH_OTP_INVALID_OR_EXPIRED";
    public static final String AUTH_2FA_CODE_INVALID = "AUTH_2FA_CODE_INVALID";
    public static final String AUTH_2FA_ATTEMPTS_EXCEEDED = "AUTH_2FA_ATTEMPTS_EXCEEDED";
    public static final String AUTH_RESET_TOKEN_INVALID_OR_EXPIRED = "AUTH_RESET_TOKEN_INVALID_OR_EXPIRED";
    public static final String AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED = "AUTH_REFRESH_TOKEN_INVALID_OR_REVOKED";
    public static final String AUTH_OTP_RESEND_TOO_SOON = "AUTH_OTP_RESEND_TOO_SOON";
    public static final String AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND";
    public static final String AUTH_TENANT_NOT_FOUND = "AUTH_TENANT_NOT_FOUND";

    // Account Success
    public static final String ACCOUNT_PROFILE_FETCH_SUCCESS = "ACCOUNT_PROFILE_FETCH_SUCCESS";
    public static final String ACCOUNT_PROFILE_UPDATE_SUCCESS = "ACCOUNT_PROFILE_UPDATE_SUCCESS";
    public static final String ACCOUNT_PASSWORD_CHANGE_SUCCESS = "ACCOUNT_PASSWORD_CHANGE_SUCCESS";
    public static final String ACCOUNT_2FA_STATUS_FETCH_SUCCESS = "ACCOUNT_2FA_STATUS_FETCH_SUCCESS";
    public static final String ACCOUNT_2FA_SETUP_SUCCESS = "ACCOUNT_2FA_SETUP_SUCCESS";
    public static final String ACCOUNT_2FA_ENABLED_SUCCESS = "ACCOUNT_2FA_ENABLED_SUCCESS";
    public static final String ACCOUNT_2FA_DISABLED_SUCCESS = "ACCOUNT_2FA_DISABLED_SUCCESS";
    public static final String ACCOUNT_2FA_BACKUP_CODES_REGENERATED = "ACCOUNT_2FA_BACKUP_CODES_REGENERATED";
    public static final String ACCOUNT_SESSIONS_FETCH_SUCCESS = "ACCOUNT_SESSIONS_FETCH_SUCCESS";
    public static final String ACCOUNT_SESSION_REVOKED_SUCCESS = "ACCOUNT_SESSION_REVOKED_SUCCESS";
    public static final String ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS = "ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS";

    // Account Errors
    public static final String ACCOUNT_OLD_PASSWORD_INCORRECT = "ACCOUNT_OLD_PASSWORD_INCORRECT";
    public static final String ACCOUNT_2FA_ALREADY_ENABLED = "ACCOUNT_2FA_ALREADY_ENABLED";
    public static final String ACCOUNT_2FA_NOT_ENABLED = "ACCOUNT_2FA_NOT_ENABLED";
    public static final String ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE = "ACCOUNT_2FA_INVALID_PASSWORD_OR_CODE";
    public static final String ACCOUNT_SESSION_NOT_FOUND = "ACCOUNT_SESSION_NOT_FOUND";

    // General Validation & System
    public static final String VALIDATION_FAILED = "VALIDATION_FAILED";
    public static final String VALIDATION_REQUIRED = "VALIDATION_REQUIRED";
    public static final String VALIDATION_EMAIL = "VALIDATION_EMAIL";
    public static final String VALIDATION_SIZE = "VALIDATION_SIZE";
    public static final String VALIDATION_PATTERN = "VALIDATION_PATTERN";
    public static final String VALIDATION_PASSWORD_TOO_WEAK = "VALIDATION_PASSWORD_TOO_WEAK";
    public static final String VALIDATION_MIN = "VALIDATION_MIN";
    public static final String VALIDATION_MAX = "VALIDATION_MAX";
    public static final String VALIDATION_INVALID = "VALIDATION_INVALID";
    public static final String VALIDATION_MALFORMED_JSON = "VALIDATION_MALFORMED_JSON";
    public static final String VALIDATION_SLUG_INVALID = "VALIDATION_SLUG_INVALID";
    public static final String VALIDATION_EMAIL_DUPLICATE = "VALIDATION_EMAIL_DUPLICATE";
    public static final String VALIDATION_SLUG_DUPLICATE = "VALIDATION_SLUG_DUPLICATE";
    public static final String BAD_REQUEST = "BAD_REQUEST";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED";
    public static final String UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE";
    public static final String INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR";

    // IAM Functional & Data Permission Enforcement (SOL-02, TASK-267/289/290)
    public static final String IAM_PERMISSION_DENIED_FUNCTIONAL = "IAM_PERMISSION_DENIED_FUNCTIONAL";
    public static final String IAM_PERMISSION_DENIED_DATA_SCOPE = "IAM_PERMISSION_DENIED_DATA_SCOPE";
    public static final String IAM_PERMISSION_DENIED_EXPORT = "IAM_PERMISSION_DENIED_EXPORT";

    // Tenant lifecycle guards (SOL-01, TASK-272/288)
    public static final String TENANT_LOCKED = "TENANT_LOCKED";
    public static final String TENANT_SUSPENDED = "TENANT_SUSPENDED";
    public static final String TENANT_NOT_FOUND = "TENANT_NOT_FOUND";

    // Tenant resource quota (TASK-269 / BUG-53)
    public static final String PLATFORM_TENANT_QUOTA_EXCEEDED = "PLATFORM_TENANT_QUOTA_EXCEEDED";

    // Reference Entity success codes (FEAT-17 / TASK-284, DES-02-API 6.3)
    public static final String CORE_SAMPLE_RECORD_CREATED = "CORE_SAMPLE_RECORD_CREATED";
    public static final String CORE_SAMPLE_RECORD_LIST_SUCCESS = "CORE_SAMPLE_RECORD_LIST_SUCCESS";
    public static final String CORE_SAMPLE_RECORD_DETAIL_SUCCESS = "CORE_SAMPLE_RECORD_DETAIL_SUCCESS";
    public static final String CORE_SAMPLE_RECORD_UPDATED = "CORE_SAMPLE_RECORD_UPDATED";
    public static final String CORE_SAMPLE_RECORD_DELETED = "CORE_SAMPLE_RECORD_DELETED";
    public static final String CORE_SAMPLE_RECORD_SHARED = "CORE_SAMPLE_RECORD_SHARED";
    public static final String CORE_SAMPLE_RECORD_EXPORTED = "CORE_SAMPLE_RECORD_EXPORTED";
}
