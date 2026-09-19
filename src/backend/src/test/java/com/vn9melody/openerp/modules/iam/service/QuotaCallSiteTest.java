package com.vn9melody.openerp.modules.iam.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.modules.core.service.TenantQuotaService;
import com.vn9melody.openerp.support.S2EngineFixtures;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BUG-53: the shared user-provisioning quota entry point ({@code AccountService
 * .enforceUserQuota}) blocks the user after {@code max_users} is reached on real
 * PostgreSQL + Redis.
 */
@QuarkusTest
public class QuotaCallSiteTest {

    @Inject
    AccountService accountService;

    @Inject
    TenantQuotaService tenantQuotaService;

    @Inject
    EntityManager em;

    @Test
    @Transactional
    @DisplayName("BUG-53: tenant max_users=1 có 1 user -> tạo user thứ 2 bị chặn 409 PLATFORM_TENANT_QUOTA_EXCEEDED")
    public void testSecondUserBlockedAtMaxUsersOne() {
        String suffix = S2EngineFixtures.suffix();
        UUID tenantId = S2EngineFixtures.insertTenant(em, suffix);
        em.createNativeQuery("UPDATE tenants SET max_users = 1 WHERE id = ?1")
            .setParameter(1, tenantId)
            .executeUpdate();

        UUID firstUser = S2EngineFixtures.insertUser(em, "quota-first-" + suffix);
        S2EngineFixtures.insertUserTenant(em, firstUser, tenantId, "ADMIN");
        tenantQuotaService.invalidateUserCount(tenantId);

        ApiException exception = Assertions.assertThrows(ApiException.class,
            () -> accountService.enforceUserQuota(tenantId));
        Assertions.assertEquals(409, exception.getStatusCode());
        Assertions.assertEquals(ErrorCode.PLATFORM_TENANT_QUOTA_EXCEEDED, exception.getErrorCode());
        Assertions.assertEquals(1, ((Number) exception.getParams().get("limit")).intValue());
        Assertions.assertEquals(1, ((Number) exception.getParams().get("current")).intValue());
    }

    @Test
    @Transactional
    @DisplayName("BUG-53: tenant còn quota cho phép tạo user kế tiếp")
    public void testUserAllowedWhenBelowQuota() {
        String suffix = S2EngineFixtures.suffix();
        UUID tenantId = S2EngineFixtures.insertTenant(em, suffix);
        em.createNativeQuery("UPDATE tenants SET max_users = 2 WHERE id = ?1")
            .setParameter(1, tenantId)
            .executeUpdate();

        UUID firstUser = S2EngineFixtures.insertUser(em, "quota-ok-" + suffix);
        S2EngineFixtures.insertUserTenant(em, firstUser, tenantId, "ADMIN");
        tenantQuotaService.invalidateUserCount(tenantId);

        Assertions.assertDoesNotThrow(() -> accountService.enforceUserQuota(tenantId));
    }
}
