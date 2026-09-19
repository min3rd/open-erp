package com.vn9melody.openerp.modules.core.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.audit.AuditRecorder;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Enforces tenant resource quotas (TASK-269 / BUG-53).
 *
 * <p>User count is read from the Redis counter {@code quota:users:{tenantId}}
 * when present and falls back to a real PostgreSQL count otherwise (the counter
 * is a short-lived cache, deleted by {@link #invalidateUserCount(UUID)} after a
 * membership change). Storage quota is a wiring skeleton for the upcoming
 * storage service: usage is currently reported as 0 bytes.</p>
 */
@ApplicationScoped
public class TenantQuotaService {

    public static final String USERS_COUNTER_KEY_PREFIX = "quota:users:";
    private static final long COUNTER_TTL_SECONDS = 300;
    private static final long BYTES_PER_MB = 1024L * 1024L;

    private static final Logger LOG = Logger.getLogger(TenantQuotaService.class);

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    @Inject
    Instance<AuditRecorder> auditRecorders;

    /** Fails with {@code 409 PLATFORM_TENANT_QUOTA_EXCEEDED} when the tenant is full. */
    public void checkUserQuota(UUID tenantId) {
        Tenant tenant = requireTenant(tenantId);
        int maxUsers = tenant.maxUsers != null ? tenant.maxUsers : Integer.MAX_VALUE;
        long current = currentUserCount(tenantId);
        if (current >= maxUsers) {
            Map<String, Object> params = quotaParams(maxUsers, current);
            recordDenied(tenantId, "TENANT_QUOTA_USER_EXCEEDED", params);
            throw new ApiException(409, ErrorCode.PLATFORM_TENANT_QUOTA_EXCEEDED,
                "Tenant user quota exceeded", params);
        }
    }

    /**
     * Storage hook (TASK-269): rejects uploads that would exceed
     * {@code tenants.max_storage_mb}. Actual usage is provided by the storage
     * service once available; until then usage is 0.
     */
    public void checkStorageQuota(UUID tenantId, long additionalBytes) {
        Tenant tenant = requireTenant(tenantId);
        long maxBytes = (tenant.maxStorageMb != null ? tenant.maxStorageMb.longValue() : Long.MAX_VALUE) * BYTES_PER_MB;
        long currentBytes = currentStorageBytes(tenantId);
        if (additionalBytes > 0 && currentBytes + additionalBytes > maxBytes) {
            Map<String, Object> params = quotaParams(maxBytes, currentBytes);
            recordDenied(tenantId, "TENANT_QUOTA_STORAGE_EXCEEDED", params);
            throw new ApiException(409, ErrorCode.PLATFORM_TENANT_QUOTA_EXCEEDED,
                "Tenant storage quota exceeded", params);
        }
    }

    /** Current active user count: Redis counter first, PostgreSQL fallback. */
    public long currentUserCount(UUID tenantId) {
        String key = counterKey(tenantId);
        try {
            String cached = redis.value(String.class).get(key);
            if (cached != null && !cached.isBlank()) {
                return Long.parseLong(cached.trim());
            }
        } catch (Exception e) {
            LOG.warnf("Quota counter read failed for %s: %s", key, e.getMessage());
        }

        long fromDatabase = countUsersInDatabase(tenantId);
        try {
            redis.value(String.class).setex(key, COUNTER_TTL_SECONDS, Long.toString(fromDatabase));
        } catch (Exception e) {
            LOG.warnf("Quota counter write failed for %s: %s", key, e.getMessage());
        }
        return fromDatabase;
    }

    /** Drops the cached counter so the next check recomputes from the database. */
    public void invalidateUserCount(UUID tenantId) {
        if (tenantId == null) {
            return;
        }
        try {
            redis.key(String.class).del(counterKey(tenantId));
        } catch (Exception e) {
            LOG.warnf("Quota counter invalidation failed: %s", e.getMessage());
        }
    }

    public String counterKey(UUID tenantId) {
        return USERS_COUNTER_KEY_PREFIX + tenantId;
    }

    long countUsersInDatabase(UUID tenantId) {
        Number count = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(DISTINCT user_id) FROM ("
                    + " SELECT user_id FROM user_tenants WHERE tenant_id = :tenantId"
                    + " UNION"
                    + " SELECT user_id FROM user_department_memberships WHERE tenant_id = :tenantId"
                    + ") tenant_users")
            .setParameter("tenantId", tenantId)
            .getSingleResult();
        return count != null ? count.longValue() : 0L;
    }

    /** Storage usage placeholder until the storage service reports real bytes. */
    long currentStorageBytes(UUID tenantId) {
        return 0L;
    }

    private Tenant requireTenant(UUID tenantId) {
        if (tenantId == null) {
            throw new ApiException(404, ErrorCode.TENANT_NOT_FOUND, "Tenant not found");
        }
        Tenant tenant = entityManager.find(Tenant.class, tenantId);
        if (tenant == null) {
            throw new ApiException(404, ErrorCode.TENANT_NOT_FOUND, "Tenant not found");
        }
        return tenant;
    }

    private Map<String, Object> quotaParams(long quota, long current) {
        Map<String, Object> params = new HashMap<>();
        params.put(ResponseKey.QUOTA.getKey(), quota);
        params.put(ResponseKey.CURRENT.getKey(), current);
        // BUG-53 acceptance uses {limit, current}
        params.put("limit", quota);
        return params;
    }

    private void recordDenied(UUID tenantId, String action, Map<String, Object> params) {
        Map<String, Object> details = new HashMap<>(params);
        AuditRecorder.AuditEvent event = new AuditRecorder.AuditEvent(
            tenantId, null, action, "TENANT_QUOTA", null, AuditResult.DENIED, details, null);
        for (AuditRecorder recorder : auditRecorders) {
            recorder.record(event);
        }
    }
}
