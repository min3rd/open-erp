package com.vn9melody.openerp.modules.platform.api;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Type-safe payload keys for the Platform Super Admin APIs. Mirrors the
 * {@code ResponseKey} convention from the Core module for all fields returned
 * under the {@code data} map (AGENTS.md: zero hardcoded payload keys).
 */
public enum PlatformResponseKey {
    // Shared
    TENANT_ID("tenant_id"),
    TENANT_SLUG("tenant_slug"),
    TENANT_NAME("tenant_name"),
    USER_ID("user_id"),
    EMAIL("email"),
    FULL_NAME("full_name"),
    TYPE("type"),
    STATUS("status"),
    ROLE("role"),
    CREATED_AT("created_at"),
    UPDATED_AT("updated_at"),

    // Tenant management
    PLAN_TIER("plan_tier"),
    MAX_USERS("max_users"),
    ACTIVE_USERS_COUNT("active_users_count"),
    MAX_STORAGE_MB("max_storage_mb"),
    USED_STORAGE_MB("used_storage_mb"),
    TRIAL_ENDS_AT("trial_ends_at"),
    IS_LOCKED("is_locked"),
    LOCK_REASON("lock_reason"),
    LOCKED_AT("locked_at"),
    ALLOWED_PLUGINS("allowed_plugins"),

    // Global users
    LAST_LOGIN_AT("last_login_at"),
    IS_2FA_ENABLED("is_2fa_enabled"),

    // Impersonation
    IMPERSONATION_TOKEN("impersonation_token"),
    EXPIRES_IN_SECONDS("expires_in_seconds"),
    TARGET_TENANT_ID("target_tenant_id"),
    TARGET_TENANT_NAME("target_tenant_name"),
    TARGET_USER_ID("target_user_id"),
    TARGET_USER_EMAIL("target_user_email"),
    STARTED_AT("started_at"),
    ENDED_AT("ended_at"),
    SUPPORT_TICKET("support_ticket"),
    SUPER_ADMIN_USER_ID("super_admin_user_id"),
    SUPER_ADMIN_EMAIL("super_admin_email"),
    LOG_ID("log_id"),

    // Health
    SYSTEM_STATUS("system_status"),
    DATABASE("database"),
    REDIS("redis"),
    KAFKA("kafka"),
    PLATFORM_METRICS("platform_metrics"),
    TOTAL_TENANTS("total_tenants"),
    ACTIVE_TENANTS("active_tenants"),
    SUSPENDED_TENANTS("suspended_tenants"),
    TOTAL_USERS("total_users"),
    ACTIVE_SESSIONS_NOW("active_sessions_now"),

    // Audit
    EVENT_ID("event_id"),
    SCOPE("scope"),
    ACTOR_USER_ID("actor_user_id"),
    ACTOR_TYPE("actor_type"),
    ACTOR_EMAIL("actor_email"),
    ACTION("action"),
    RESULT("result"),
    RESOURCE_TYPE("resource_type"),
    RESOURCE_ID("resource_id"),
    CORRELATION_ID("correlation_id"),
    DETAILS("details"),
    IP_ADDRESS("ip_address"),
    USER_AGENT("user_agent"),
    PREV_HASH("prev_hash"),
    ENTRY_HASH("entry_hash"),
    CHAIN_STATUS("chain_status"),
    CHECKED_COUNT("checked_count"),
    BROKEN_AT_LOG_ID("broken_at_log_id"),
    BROKEN_AT_EVENT_ID("broken_at_event_id"),

    // Platform admins
    ADMIN_ID("admin_id"),
    MUST_CHANGE_PASSWORD("must_change_password"),
    TWO_FACTOR_REQUIRED("two_factor_required"),
    DISABLED_AT("disabled_at"),
    RESET_TOKEN_SENT("reset_token_sent");

    private final String key;

    PlatformResponseKey(String key) {
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
