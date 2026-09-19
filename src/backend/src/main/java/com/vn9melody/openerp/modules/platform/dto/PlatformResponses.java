package com.vn9melody.openerp.modules.platform.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import com.vn9melody.openerp.modules.platform.api.PlatformResponseKey;

/** Typed response payloads for the Platform APIs (no free-form maps). */
public final class PlatformResponses {

    private PlatformResponses() {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TenantItem {
        @JsonProperty(PlatformResponseKey.Json.TENANT_ID)
        public String tenantId;
        public String slug;
        public String name;
        public String type;

        @JsonProperty(PlatformResponseKey.Json.PLAN_TIER)
        public String planTier;
        public String status;

        @JsonProperty(PlatformResponseKey.Json.MAX_USERS)
        public Integer maxUsers;

        @JsonProperty(PlatformResponseKey.Json.ACTIVE_USERS_COUNT)
        public Long activeUsersCount;

        @JsonProperty(PlatformResponseKey.Json.MAX_STORAGE_MB)
        public Integer maxStorageMb;

        @JsonProperty(PlatformResponseKey.Json.USED_STORAGE_MB)
        public Long usedStorageMb;

        @JsonProperty(PlatformResponseKey.Json.TRIAL_ENDS_AT)
        public Instant trialEndsAt;

        @JsonProperty(PlatformResponseKey.Json.IS_LOCKED)
        public Boolean isLocked;

        @JsonProperty(PlatformResponseKey.Json.ALLOWED_PLUGINS)
        public List<String> allowedPlugins;

        @JsonProperty(PlatformResponseKey.Json.CREATED_AT)
        public Instant createdAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TenantDetail {
        @JsonProperty(PlatformResponseKey.Json.TENANT_ID)
        public String tenantId;
        public String slug;
        public String name;
        public String type;

        @JsonProperty(PlatformResponseKey.Json.PLAN_TIER)
        public String planTier;
        public String status;

        @JsonProperty(PlatformResponseKey.Json.MAX_USERS)
        public Integer maxUsers;

        @JsonProperty(PlatformResponseKey.Json.ACTIVE_USERS_COUNT)
        public Long activeUsersCount;

        @JsonProperty(PlatformResponseKey.Json.MAX_STORAGE_MB)
        public Integer maxStorageMb;

        @JsonProperty(PlatformResponseKey.Json.USED_STORAGE_MB)
        public Long usedStorageMb;

        @JsonProperty(PlatformResponseKey.Json.TRIAL_ENDS_AT)
        public Instant trialEndsAt;

        @JsonProperty(PlatformResponseKey.Json.IS_LOCKED)
        public Boolean isLocked;

        @JsonProperty(PlatformResponseKey.Json.LOCK_REASON)
        public String lockReason;

        @JsonProperty(PlatformResponseKey.Json.LOCKED_AT)
        public Instant lockedAt;

        @JsonProperty(PlatformResponseKey.Json.ALLOWED_PLUGINS)
        public List<String> allowedPlugins;

        @JsonProperty(PlatformResponseKey.Json.CREATED_AT)
        public Instant createdAt;
    }

    public static class Quota {
        @JsonProperty(PlatformResponseKey.Json.TENANT_ID)
        public String tenantId;

        @JsonProperty(PlatformResponseKey.Json.PLAN_TIER)
        public String planTier;

        @JsonProperty(PlatformResponseKey.Json.MAX_USERS)
        public Integer maxUsers;

        @JsonProperty(PlatformResponseKey.Json.MAX_STORAGE_MB)
        public Integer maxStorageMb;

        @JsonProperty(PlatformResponseKey.Json.ALLOWED_PLUGINS)
        public List<String> allowedPlugins;
    }

    public static class TenantStatus {
        @JsonProperty(PlatformResponseKey.Json.TENANT_ID)
        public String tenantId;
        public String status;

        @JsonProperty(PlatformResponseKey.Json.IS_LOCKED)
        public Boolean isLocked;

        @JsonProperty(PlatformResponseKey.Json.LOCKED_AT)
        public Instant lockedAt;

        @JsonProperty(PlatformResponseKey.Json.LOCK_REASON)
        public String lockReason;
    }

    /** Plugin catalog entry (FEAT-20): i18n keys only, no hardcoded labels. */
    public static class PluginItem {
        @JsonProperty(PlatformResponseKey.Json.KEY)
        public String key;

        @JsonProperty(PlatformResponseKey.Json.NAME_KEY)
        public String nameKey;

        @JsonProperty(PlatformResponseKey.Json.DESCRIPTION_KEY)
        public String descriptionKey;

        @JsonProperty(PlatformResponseKey.Json.IS_CORE)
        public Boolean isCore;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserItem {
        @JsonProperty(PlatformResponseKey.Json.USER_ID)
        public String userId;
        public String email;

        @JsonProperty(PlatformResponseKey.Json.FULL_NAME)
        public String fullName;
        public String status;

        @JsonProperty(PlatformResponseKey.Json.TENANT_ID)
        public String tenantId;

        @JsonProperty(PlatformResponseKey.Json.TENANT_NAME)
        public String tenantName;

        @JsonProperty(PlatformResponseKey.Json.LAST_LOGIN_AT)
        public Instant lastLoginAt;

        @JsonProperty(PlatformResponseKey.Json.IS_2FA_ENABLED)
        public Boolean is2FaEnabled;
    }

    public static class UserStatus {
        @JsonProperty(PlatformResponseKey.Json.USER_ID)
        public String userId;
        public String status;

        @JsonProperty(PlatformResponseKey.Json.LOCKED_AT)
        public Instant lockedAt;
    }

    public static class UserReset {
        @JsonProperty(PlatformResponseKey.Json.USER_ID)
        public String userId;

        @JsonProperty(PlatformResponseKey.Json.RESET_TOKEN_SENT)
        public Boolean resetTokenSent;
    }

    public static class BreakGlassResult {
        @JsonProperty(PlatformResponseKey.Json.USER_ID)
        public String userId;
        public String action;

        @JsonProperty(PlatformResponseKey.Json.RESET_TOKEN_SENT)
        public Boolean resetTokenSent;

        @JsonProperty(PlatformResponseKey.Json.IS_2FA_ENABLED)
        public Boolean is2FaEnabled;
    }

    public static class ImpersonationStart {
        @JsonProperty(PlatformResponseKey.Json.IMPERSONATION_TOKEN)
        public String impersonationToken;

        @JsonProperty(PlatformResponseKey.Json.EXPIRES_IN_SECONDS)
        public Integer expiresInSeconds;

        @JsonProperty(PlatformResponseKey.Json.TARGET_TENANT_ID)
        public String targetTenantId;

        @JsonProperty(PlatformResponseKey.Json.TARGET_TENANT_NAME)
        public String targetTenantName;

        @JsonProperty(PlatformResponseKey.Json.TARGET_USER_ID)
        public String targetUserId;

        @JsonProperty(PlatformResponseKey.Json.TARGET_USER_EMAIL)
        public String targetUserEmail;

        @JsonProperty(PlatformResponseKey.Json.STARTED_AT)
        public Instant startedAt;
    }

    public static class ImpersonationLogItem {
        @JsonProperty(PlatformResponseKey.Json.LOG_ID)
        public String logId;

        @JsonProperty(PlatformResponseKey.Json.SUPER_ADMIN_USER_ID)
        public String superAdminUserId;

        @JsonProperty(PlatformResponseKey.Json.SUPER_ADMIN_EMAIL)
        public String superAdminEmail;

        @JsonProperty(PlatformResponseKey.Json.TARGET_TENANT_ID)
        public String targetTenantId;

        @JsonProperty(PlatformResponseKey.Json.TARGET_USER_ID)
        public String targetUserId;

        @JsonProperty(PlatformResponseKey.Json.SUPPORT_TICKET)
        public String supportTicket;
        public String status;

        @JsonProperty(PlatformResponseKey.Json.STARTED_AT)
        public Instant startedAt;

        @JsonProperty(PlatformResponseKey.Json.ENDED_AT)
        public Instant endedAt;
    }

    public static class AdminItem {
        @JsonProperty(PlatformResponseKey.Json.ADMIN_ID)
        public String adminId;

        @JsonProperty(PlatformResponseKey.Json.USER_ID)
        public String userId;
        public String email;

        @JsonProperty(PlatformResponseKey.Json.FULL_NAME)
        public String fullName;
        public String role;
        public String status;

        @JsonProperty(PlatformResponseKey.Json.MUST_CHANGE_PASSWORD)
        public Boolean mustChangePassword;

        @JsonProperty(PlatformResponseKey.Json.TWO_FACTOR_REQUIRED)
        public Boolean twoFactorRequired;

        @JsonProperty(PlatformResponseKey.Json.IS_2FA_ENABLED)
        public Boolean is2FaEnabled;

        @JsonProperty(PlatformResponseKey.Json.LAST_LOGIN_AT)
        public Instant lastLoginAt;

        @JsonProperty(PlatformResponseKey.Json.DISABLED_AT)
        public Instant disabledAt;

        @JsonProperty(PlatformResponseKey.Json.CREATED_AT)
        public Instant createdAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AdminMutation {
        @JsonProperty(PlatformResponseKey.Json.ADMIN_ID)
        public String adminId;

        @JsonProperty(PlatformResponseKey.Json.USER_ID)
        public String userId;
        public String email;
        public String role;
        public String status;

        @JsonProperty(PlatformResponseKey.Json.MUST_CHANGE_PASSWORD)
        public Boolean mustChangePassword;

        @JsonProperty(PlatformResponseKey.Json.TWO_FACTOR_REQUIRED)
        public Boolean twoFactorRequired;

        @JsonProperty(PlatformResponseKey.Json.DISABLED_AT)
        public Instant disabledAt;

        @JsonProperty(PlatformResponseKey.Json.RESET_TOKEN_SENT)
        public Boolean resetTokenSent;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuditLogItem {
        @JsonProperty(PlatformResponseKey.Json.LOG_ID)
        public String logId;

        @JsonProperty(PlatformResponseKey.Json.EVENT_ID)
        public String eventId;
        public String scope;

        @JsonProperty(PlatformResponseKey.Json.TENANT_ID)
        public String tenantId;

        @JsonProperty(PlatformResponseKey.Json.ACTOR_USER_ID)
        public String actorUserId;

        @JsonProperty(PlatformResponseKey.Json.ACTOR_TYPE)
        public String actorType;

        @JsonProperty(PlatformResponseKey.Json.ACTOR_EMAIL)
        public String actorEmail;
        public String action;

        @JsonProperty(PlatformResponseKey.Json.RESOURCE_TYPE)
        public String resourceType;

        @JsonProperty(PlatformResponseKey.Json.RESOURCE_ID)
        public String resourceId;

        @JsonProperty(PlatformResponseKey.Json.TARGET_TENANT_ID)
        public String targetTenantId;

        @JsonProperty(PlatformResponseKey.Json.TARGET_TENANT_NAME)
        public String targetTenantName;

        @JsonProperty(PlatformResponseKey.Json.TARGET_USER_ID)
        public String targetUserId;
        public String result;

        @JsonProperty(PlatformResponseKey.Json.CORRELATION_ID)
        public String correlationId;

        @JsonProperty(PlatformResponseKey.Json.ENTRY_HASH)
        public String entryHash;
        public Object details;

        @JsonProperty(PlatformResponseKey.Json.IP_ADDRESS)
        public String ipAddress;

        @JsonProperty(PlatformResponseKey.Json.CREATED_AT)
        public Instant createdAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuditLogDetail extends AuditLogItem {
        @JsonProperty(PlatformResponseKey.Json.USER_AGENT)
        public String userAgent;

        @JsonProperty(PlatformResponseKey.Json.PREV_HASH)
        public String prevHash;
    }

    public static class Health {
        @JsonProperty(PlatformResponseKey.Json.SYSTEM_STATUS)
        public String systemStatus;

        public DatabaseHealth database;
        public RedisHealth redis;
        public KafkaHealth kafka;

        @JsonProperty(PlatformResponseKey.Json.PLATFORM_METRICS)
        public PlatformMetrics platformMetrics;
    }

    public static class DatabaseHealth {
        public String primary;
        public String replica;

        @JsonProperty(PlatformResponseKey.Json.REPLICATION_LAG_MS)
        public Long replicationLagMs;

        @JsonProperty(PlatformResponseKey.Json.ACTIVE_CONNECTIONS)
        public Integer activeConnections;

        @JsonProperty(PlatformResponseKey.Json.MAX_CONNECTIONS)
        public Integer maxConnections;
    }

    public static class RedisHealth {
        public String status;

        @JsonProperty(PlatformResponseKey.Json.USED_MEMORY_HUMAN)
        public String usedMemoryHuman;

        @JsonProperty(PlatformResponseKey.Json.CONNECTED_CLIENTS)
        public Integer connectedClients;
    }

    public static class KafkaHealth {
        public String status;

        @JsonProperty(PlatformResponseKey.Json.CLUSTER_ID)
        public String clusterId;

        @JsonProperty(PlatformResponseKey.Json.NODES_COUNT)
        public Integer nodesCount;
    }

    public static class PlatformMetrics {
        @JsonProperty(PlatformResponseKey.Json.TOTAL_TENANTS)
        public Long totalTenants;

        @JsonProperty(PlatformResponseKey.Json.ACTIVE_TENANTS)
        public Long activeTenants;

        @JsonProperty(PlatformResponseKey.Json.SUSPENDED_TENANTS)
        public Long suspendedTenants;

        @JsonProperty(PlatformResponseKey.Json.TOTAL_USERS)
        public Long totalUsers;

        @JsonProperty(PlatformResponseKey.Json.ACTIVE_SESSIONS_NOW)
        public Long activeSessionsNow;
    }
}
