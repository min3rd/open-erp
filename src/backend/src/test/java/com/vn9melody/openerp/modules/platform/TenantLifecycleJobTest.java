package com.vn9melody.openerp.modules.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.service.PlatformAuditActions;
import com.vn9melody.openerp.modules.platform.service.TenantLifecycleJob;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class TenantLifecycleJobTest {

    @Inject
    TenantLifecycleJob lifecycleJob;

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private UUID expiredTrialId;
    private UUID futureTrialId;
    private UUID pendingDeletionId;

    @BeforeEach
    public void setup() {
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            PlatformTestSupport.createPlatformAdmin(PlatformTestSupport.PREFIX + "life-admin@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);

            User owner = PlatformTestSupport.createUser(PlatformTestSupport.PREFIX + "life-owner@example.com",
                AccountStatus.ACTIVE, passwordHashService);

            Tenant expiredTrial = PlatformTestSupport.createTenant(PlatformTestSupport.PREFIX + "life-expired",
                TenantStatus.TRIAL);
            expiredTrial.trialEndsAt = Instant.now().minus(2, ChronoUnit.DAYS);
            expiredTrial.persist();
            PlatformTestSupport.addMembership(owner, expiredTrial, UserRole.TENANT_ADMIN);
            expiredTrialId = expiredTrial.id;

            Tenant futureTrial = PlatformTestSupport.createTenant(PlatformTestSupport.PREFIX + "life-future",
                TenantStatus.TRIAL);
            futureTrial.trialEndsAt = Instant.now().plus(5, ChronoUnit.DAYS);
            futureTrial.persist();
            futureTrialId = futureTrial.id;

            Tenant pending = PlatformTestSupport.createTenant(PlatformTestSupport.PREFIX + "life-pending",
                TenantStatus.PENDING_DELETION);
            pending.updatedAt = Instant.now().minus(40, ChronoUnit.DAYS);
            pending.persist();
            pendingDeletionId = pending.id;
        });
        PlatformTestSupport.clearRedis(redis);
    }

    @AfterEach
    public void tearDown() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
        PlatformTestSupport.clearRedis(redis);
    }

    @Test
    @DisplayName("TASK-272/BR-SA-05: TRIAL quá hạn → EXPIRED, idempotent, audit SYSTEM")
    public void testExpireTrialsIdempotent() {
        int expired = lifecycleJob.expireTrials(Instant.now());
        assertEquals(1, expired);

        QuarkusTransaction.requiringNew().run(() -> {
            Tenant tenant = Tenant.findById(expiredTrialId);
            assertEquals(TenantStatus.EXPIRED, tenant.status);
            Tenant future = Tenant.findById(futureTrialId);
            assertEquals(TenantStatus.TRIAL, future.status);
        });

        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, PlatformAuditActions.TENANT_AUTO_EXPIRED));
        Object actorType = QuarkusTransaction.requiringNew().call(() -> entityManager.createNativeQuery(
                "SELECT actor_type FROM platform_audit_logs WHERE action = :action")
            .setParameter("action", PlatformAuditActions.TENANT_AUTO_EXPIRED)
            .getSingleResult());
        assertEquals("SYSTEM", actorType.toString());

        assertEquals(0, lifecycleJob.expireTrials(Instant.now()));
    }

    @Test
    @DisplayName("TASK-272: PENDING_DELETION quá grace → DELETED (soft), không xóa cứng")
    public void testFinalizeDeletionsSoftDelete() {
        int deleted = lifecycleJob.finalizeDeletions(Instant.now());
        assertEquals(1, deleted);

        QuarkusTransaction.requiringNew().run(() -> {
            Tenant tenant = Tenant.findById(pendingDeletionId);
            assertNotNull(tenant);
            assertEquals(TenantStatus.DELETED, tenant.status);
            assertTrue(Boolean.TRUE.equals(tenant.isLocked));
        });
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, PlatformAuditActions.TENANT_AUTO_DELETED));
    }

    @Test
    @DisplayName("TASK-272: runLifecycle tổng hợp chạy cả hai nhánh")
    public void testRunLifecycle() {
        TenantLifecycleJob.LifecycleResult result = lifecycleJob.runLifecycle(Instant.now());
        assertEquals(1, result.expired);
        assertEquals(1, result.deleted);
    }
}
