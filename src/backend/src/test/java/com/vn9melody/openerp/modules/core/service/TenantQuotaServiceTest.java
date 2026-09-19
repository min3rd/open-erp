package com.vn9melody.openerp.modules.core.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * TASK-269 / BUG-53: tenant quota enforcement on real PostgreSQL + Redis
 * (boundary cases: at limit and one over).
 */
@QuarkusTest
public class TenantQuotaServiceTest {

    @Inject
    TenantQuotaService tenantQuotaService;

    @Inject
    EntityManager em;

    @Inject
    RedisDataSource redis;

    private String suffix;
    private UUID tenantId;

    @BeforeEach
    @Transactional
    public void setup() {
        suffix = S2EngineFixtures.suffix();
        tenantId = S2EngineFixtures.insertTenant(em, suffix);
        em.createNativeQuery("UPDATE tenants SET max_users = 2, max_storage_mb = 1 WHERE id = ?1")
            .setParameter(1, tenantId)
            .executeUpdate();
        UUID userA = S2EngineFixtures.insertUser(em, "quota-a-" + suffix);
        UUID userB = S2EngineFixtures.insertUser(em, "quota-b-" + suffix);
        S2EngineFixtures.insertUserTenant(em, userA, tenantId, "ADMIN");
        S2EngineFixtures.insertUserTenant(em, userB, tenantId, "MEMBER");
        tenantQuotaService.invalidateUserCount(tenantId);
    }

    @Test
    @Transactional
    @DisplayName("TASK-269: chặn user thứ max_users + 1 với 409 PLATFORM_TENANT_QUOTA_EXCEEDED")
    public void testUserQuotaExceeded() {
        ApiException exception = Assertions.assertThrows(ApiException.class,
            () -> tenantQuotaService.checkUserQuota(tenantId));
        Assertions.assertEquals(409, exception.getStatusCode());
        Assertions.assertEquals(ErrorCode.PLATFORM_TENANT_QUOTA_EXCEEDED, exception.getErrorCode());
        Assertions.assertEquals(2, ((Number) exception.getParams().get("quota")).intValue());
        Assertions.assertEquals(2, ((Number) exception.getParams().get("current")).intValue());
        Assertions.assertEquals(2, ((Number) exception.getParams().get("limit")).intValue());
    }

    @Test
    @DisplayName("TASK-269: còn quota thì cho phép tạo thêm")
    @Transactional
    public void testUserQuotaAllowedWhenBelowLimit() {
        em.createNativeQuery("UPDATE tenants SET max_users = 3 WHERE id = ?1")
            .setParameter(1, tenantId)
            .executeUpdate();
        tenantQuotaService.invalidateUserCount(tenantId);
        Assertions.assertDoesNotThrow(() -> tenantQuotaService.checkUserQuota(tenantId));
        Assertions.assertEquals(2L, tenantQuotaService.currentUserCount(tenantId));
    }

    @Test
    @DisplayName("TASK-269: fallback DB khi Redis counter bị xóa, đếm đúng user mới thêm")
    @Transactional
    public void testRedisCounterFallbackToDatabase() {
        UUID userC = S2EngineFixtures.insertUser(em, "quota-c-" + suffix);
        S2EngineFixtures.insertUserTenant(em, userC, tenantId, "MEMBER");
        tenantQuotaService.invalidateUserCount(tenantId);

        Assertions.assertEquals(3L, tenantQuotaService.currentUserCount(tenantId));
        ApiException exception = Assertions.assertThrows(ApiException.class,
            () -> tenantQuotaService.checkUserQuota(tenantId));
        Assertions.assertEquals(3, ((Number) exception.getParams().get("current")).intValue());
    }

    @Test
    @DisplayName("TASK-269: Redis counter được ưu tiên khi tồn tại")
    @Transactional
    public void testRedisCounterPreferred() {
        redis.value(String.class).setex(tenantQuotaService.counterKey(tenantId), 300, "99");
        Assertions.assertEquals(99L, tenantQuotaService.currentUserCount(tenantId));
        ApiException exception = Assertions.assertThrows(ApiException.class,
            () -> tenantQuotaService.checkUserQuota(tenantId));
        Assertions.assertEquals(99, ((Number) exception.getParams().get("current")).intValue());
    }

    @Test
    @Transactional
    @DisplayName("TASK-269: hook storage quota chặn khi vượt max_storage_mb")
    public void testStorageQuotaHook() {
        Assertions.assertDoesNotThrow(() -> tenantQuotaService.checkStorageQuota(tenantId, 512 * 1024L));
        ApiException exception = Assertions.assertThrows(ApiException.class,
            () -> tenantQuotaService.checkStorageQuota(tenantId, 2 * 1024L * 1024L));
        Assertions.assertEquals(ErrorCode.PLATFORM_TENANT_QUOTA_EXCEEDED, exception.getErrorCode());
        Assertions.assertEquals(1024L * 1024L, ((Number) exception.getParams().get("quota")).longValue());
    }
}
