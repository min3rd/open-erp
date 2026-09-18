package com.vn9melody.openerp.core.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ResponseKey {
    // Identity & User
    USER_ID("user_id"),
    EMAIL("email"),
    FULL_NAME("full_name"),
    PHONE("phone"),
    AVATAR_URL("avatar_url"),
    STATUS("status"),
    ROLE("role"),
    LANGUAGE("language"),
    TIMEZONE("timezone"),

    // Tenant & Workspace
    TENANT_ID("tenant_id"),
    TENANT_SLUG("tenant_slug"),
    TENANT_NAME("tenant_name"),
    PERSONAL_TENANT_ID("personal_tenant_id"),
    TENANTS("tenants"),
    IS_DEFAULT("is_default"),

    // Security, Session & Token
    ACCESS_TOKEN("access_token"),
    REFRESH_TOKEN("refresh_token"),
    PRE_AUTH_TOKEN("pre_auth_token"),
    SESSION_ID("session_id"),
    EXPIRES_IN("expires_in"),
    USER("user"),
    DEVICE("device"),
    IP_ADDRESS("ip_address"),
    LAST_ACTIVE_AT("last_active_at"),
    CREATED_AT("created_at"),
    IS_CURRENT("is_current"),

    // 2FA Authentication
    REQUIRES_2FA("requires_2fa"),
    REQUIRES_TENANT_SELECTION("requires_tenant_selection"),
    IS_ENABLED("is_enabled"),
    ENABLED_AT("enabled_at"),
    BACKUP_CODES_REMAINING("backup_codes_remaining"),
    SECRET_KEY("secret_key"),
    OTP_AUTH_URI("otp_auth_uri"),
    QR_CODE_URI("qr_code_uri"),
    BACKUP_CODES("backup_codes"),
    MESSAGE("message");

    private final String key;

    ResponseKey(String key) {
        this.key = key;
    }

    @JsonValue
    public String getKey() {
        return key;
    }

    @Override
    public String toString() {
        return key;
    }
}
