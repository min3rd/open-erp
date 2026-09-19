package com.vn9melody.openerp.modules.platform.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;

/** Typed response payloads for the Platform APIs (no free-form maps). */
public final class PlatformResponses {

    private PlatformResponses() {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TenantItem {
        @JsonProperty("tenant_id")
        public String tenantId;
        public String slug;
        public String name;
        public String type;

        @JsonProperty("plan_tier")
        public String planTier;
        public String status;

        @JsonProperty("max_users")
        public Integer maxUsers;

        @JsonProperty("active_users_count")
        public Long activeUsersCount;

        @JsonProperty("max_storage_mb")
        public Integer maxStorageMb;

        @JsonProperty("used_storage_mb")
        public Long usedStorageMb;

        @JsonProperty("trial_ends_at")
        public Instant trialEndsAt;

        @JsonProperty("is_locked")
        public Boolean isLocked;

        @JsonProperty("created_at")
        public Instant createdAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TenantDetail {
        @JsonProperty("tenant_id")
        public String tenantId;
        public String slug;
        public String name;
        public String type;

        @JsonProperty("plan_tier")
        public String planTier;
        public String status;

        @JsonProperty("max_users")
        public Integer maxUsers;

        @JsonProperty("active_users_count")
        public Long activeUsersCount;

        @JsonProperty("max_storage_mb")
        public Integer maxStorageMb;

        @JsonProperty("used_storage_mb")
        public Long usedStorageMb;

        @JsonProperty("trial_ends_at")
        public Instant trialEndsAt;

        @JsonProperty("is_locked")
        public Boolean isLocked;

        @JsonProperty("lock_reason")
        public String lockReason;

        @JsonProperty("locked_at")
        public Instant lockedAt;

        @JsonProperty("allowed_plugins")
        public List<String> allowedPlugins;

        @JsonProperty("created_at")
        public Instant createdAt;
    }

    public static class Quota {
        @JsonProperty("tenant_id")
        public String tenantId;

        @JsonProperty("plan_tier")
        public String planTier;

        @JsonProperty("max_users")
        public Integer maxUsers;

        @JsonProperty("max_storage_mb")
        public Integer maxStorageMb;

        @JsonProperty("allowed_plugins")
        public List<String> allowedPlugins;
    }

    public static class TenantStatus {
        @JsonProperty("tenant_id")
        public String tenantId;
        public String status;

        @JsonProperty("is_locked")
        public Boolean isLocked;

        @JsonProperty("locked_at")
        public Instant lockedAt;

        @JsonProperty("lock_reason")
        public String lockReason;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserItem {
        @JsonProperty("user_id")
        public String userId;
        public String email;

        @JsonProperty("full_name")
        public String fullName;
        public String status;

        @JsonProperty("tenant_id")
        public String tenantId;

        @JsonProperty("tenant_name")
        public String tenantName;

        @JsonProperty("last_login_at")
        public Instant lastLoginAt;

        @JsonProperty("is_2fa_enabled")
        public Boolean is2FaEnabled;
    }

    public static class UserStatus {
        @JsonProperty("user_id")
        public String userId;
        public String status;

        @JsonProperty("locked_at")
        public Instant lockedAt;
    }

    public static class UserReset {
        @JsonProperty("user_id")
        public String userId;

        @JsonProperty("reset_token_sent")
        public Boolean resetTokenSent;
    }

    public static class BreakGlassResult {
        @JsonProperty("user_id")
        public String userId;
        public String action;

        @JsonProperty("reset_token_sent")
        public Boolean resetTokenSent;

        @JsonProperty("is_2fa_enabled")
        public Boolean is2FaEnabled;
    }

    public static class ImpersonationStart {
        @JsonProperty("impersonation_token")
        public String impersonationToken;

        @JsonProperty("expires_in_seconds")
        public Integer expiresInSeconds;

        @JsonProperty("target_tenant_id")
        public String targetTenantId;

        @JsonProperty("target_tenant_name")
        public String targetTenantName;

        @JsonProperty("target_user_id")
        public String targetUserId;

        @JsonProperty("target_user_email")
        public String targetUserEmail;

        @JsonProperty("started_at")
        public Instant startedAt;
    }

    public static class ImpersonationLogItem {
        @JsonProperty("log_id")
        public String logId;

        @JsonProperty("super_admin_user_id")
        public String superAdminUserId;

        @JsonProperty("super_admin_email")
        public String superAdminEmail;

        @JsonProperty("target_tenant_id")
        public String targetTenantId;

        @JsonProperty("target_user_id")
        public String targetUserId;

        @JsonProperty("support_ticket")
        public String supportTicket;
        public String status;

        @JsonProperty("started_at")
        public Instant startedAt;

        @JsonProperty("ended_at")
        public Instant endedAt;
    }

    public static class AdminItem {
        @JsonProperty("admin_id")
        public String adminId;

        @JsonProperty("user_id")
        public String userId;
        public String email;

        @JsonProperty("full_name")
        public String fullName;
        public String role;
        public String status;

        @JsonProperty("must_change_password")
        public Boolean mustChangePassword;

        @JsonProperty("two_factor_required")
        public Boolean twoFactorRequired;

        @JsonProperty("is_2fa_enabled")
        public Boolean is2FaEnabled;

        @JsonProperty("last_login_at")
        public Instant lastLoginAt;

        @JsonProperty("disabled_at")
        public Instant disabledAt;

        @JsonProperty("created_at")
        public Instant createdAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AdminMutation {
        @JsonProperty("admin_id")
        public String adminId;

        @JsonProperty("user_id")
        public String userId;
        public String email;
        public String role;
        public String status;

        @JsonProperty("must_change_password")
        public Boolean mustChangePassword;

        @JsonProperty("two_factor_required")
        public Boolean twoFactorRequired;

        @JsonProperty("disabled_at")
        public Instant disabledAt;

        @JsonProperty("reset_token_sent")
        public Boolean resetTokenSent;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuditLogItem {
        @JsonProperty("log_id")
        public String logId;

        @JsonProperty("event_id")
        public String eventId;
        public String scope;

        @JsonProperty("tenant_id")
        public String tenantId;

        @JsonProperty("actor_user_id")
        public String actorUserId;

        @JsonProperty("actor_type")
        public String actorType;

        @JsonProperty("actor_email")
        public String actorEmail;
        public String action;

        @JsonProperty("resource_type")
        public String resourceType;

        @JsonProperty("resource_id")
        public String resourceId;

        @JsonProperty("target_tenant_id")
        public String targetTenantId;

        @JsonProperty("target_tenant_name")
        public String targetTenantName;

        @JsonProperty("target_user_id")
        public String targetUserId;
        public String result;

        @JsonProperty("correlation_id")
        public String correlationId;

        @JsonProperty("entry_hash")
        public String entryHash;
        public Object details;

        @JsonProperty("ip_address")
        public String ipAddress;

        @JsonProperty("created_at")
        public Instant createdAt;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuditLogDetail extends AuditLogItem {
        @JsonProperty("user_agent")
        public String userAgent;

        @JsonProperty("prev_hash")
        public String prevHash;
    }

    public static class Health {
        @JsonProperty("system_status")
        public String systemStatus;

        public DatabaseHealth database;
        public RedisHealth redis;
        public KafkaHealth kafka;

        @JsonProperty("platform_metrics")
        public PlatformMetrics platformMetrics;
    }

    public static class DatabaseHealth {
        public String primary;
        public String replica;

        @JsonProperty("replication_lag_ms")
        public Long replicationLagMs;

        @JsonProperty("active_connections")
        public Integer activeConnections;

        @JsonProperty("max_connections")
        public Integer maxConnections;
    }

    public static class RedisHealth {
        public String status;

        @JsonProperty("used_memory_human")
        public String usedMemoryHuman;

        @JsonProperty("connected_clients")
        public Integer connectedClients;
    }

    public static class KafkaHealth {
        public String status;

        @JsonProperty("cluster_id")
        public String clusterId;

        @JsonProperty("nodes_count")
        public Integer nodesCount;
    }

    public static class PlatformMetrics {
        @JsonProperty("total_tenants")
        public Long totalTenants;

        @JsonProperty("active_tenants")
        public Long activeTenants;

        @JsonProperty("suspended_tenants")
        public Long suspendedTenants;

        @JsonProperty("total_users")
        public Long totalUsers;

        @JsonProperty("active_sessions_now")
        public Long activeSessionsNow;
    }
}
