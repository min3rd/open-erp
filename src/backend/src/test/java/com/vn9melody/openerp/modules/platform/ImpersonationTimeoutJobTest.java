package com.vn9melody.openerp.modules.platform;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.ImpersonationStatus;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.enums.UserRole;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.model.PlatformImpersonationLog;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.service.ImpersonationTimeoutJob;
import com.vn9melody.openerp.modules.platform.service.PlatformJwtService;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.vertx.core.Vertx;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BUG-82 regression: the impersonation sweeper must close overdue STARTED sessions
 * even when triggered by the periodic timer (event-loop callback). The timestamp is
 * backdated so the sweep is deterministic and never waits for a timer tick.
 */
@QuarkusTest
public class ImpersonationTimeoutJobTest {

    @Inject
    ImpersonationTimeoutJob timeoutJob;

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    @Inject
    Vertx vertx;

    private UUID logId;

    @BeforeEach
    public void setup() {
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            PlatformSuperAdmin admin = PlatformTestSupport.createPlatformAdmin(
                PlatformTestSupport.PREFIX + "sweep-admin@example.com",
                PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService);
            User owner = PlatformTestSupport.createUser(PlatformTestSupport.PREFIX + "sweep-owner@example.com",
                AccountStatus.ACTIVE, passwordHashService);
            Tenant tenant = PlatformTestSupport.createTenant(
                PlatformTestSupport.PREFIX + "sweep-" + UUID.randomUUID().toString().substring(0, 8),
                TenantStatus.ACTIVE);
            PlatformTestSupport.addMembership(owner, tenant, UserRole.TENANT_ADMIN);

            PlatformImpersonationLog log = new PlatformImpersonationLog();
            log.superAdminUserId = admin.userId;
            log.targetTenantId = tenant.id;
            log.targetUserId = owner.id;
            log.reason = "abandoned session";
            log.supportTicket = "TCK-S2PLAT-SWEEP";
            log.ipAddress = "127.0.0.1";
            log.status = ImpersonationStatus.STARTED;
            log.startedAt = Instant.now().minusSeconds(PlatformJwtService.IMPERSONATION_TTL_SECONDS + 300);
            log.persist();
            logId = log.id;
        });
        PlatformTestSupport.clearRedis(redis);
    }

    @AfterEach
    public void tearDown() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
        PlatformTestSupport.clearRedis(redis);
    }

    @Test
    @DisplayName("BUG-78/BUG-82: sweeper đóng phiên quá TTL + audit SYSTEM, gọi lần 2 idempotent")
    public void testDirectSweepClosesOverdueSessionIdempotently() {
        assertEquals(1, timeoutJob.runTimeoutSweep());

        QuarkusTransaction.requiringNew().run(() -> {
            Object[] row = (Object[]) entityManager.createNativeQuery(
                    "SELECT status, ended_at FROM platform_impersonation_logs WHERE id = :id")
                .setParameter("id", logId)
                .getSingleResult();
            assertEquals("TIMEOUT", row[0].toString());
            assertNotNull(row[1], "ended_at must be stamped when a session times out");
        });
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "IMPERSONATION_TIMEOUT"));

        assertEquals(0, timeoutJob.runTimeoutSweep());
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "IMPERSONATION_TIMEOUT"));
    }

    @Test
    @DisplayName("BUG-82: tick mô phỏng từ event loop chạy qua worker, không crash và đóng phiên")
    public void testEventLoopTickSweepsWithoutCrash() throws Exception {
        CompletableFuture<Integer> swept = new CompletableFuture<>();
        vertx.runOnContext(id -> timeoutJob.sweepNow().onComplete(ar -> {
            if (ar.succeeded()) {
                swept.complete(ar.result());
            } else {
                swept.completeExceptionally(ar.cause());
            }
        }));

        assertEquals(1, swept.get(15, TimeUnit.SECONDS).intValue());

        QuarkusTransaction.requiringNew().run(() -> {
            Object status = entityManager.createNativeQuery(
                    "SELECT status FROM platform_impersonation_logs WHERE id = :id")
                .setParameter("id", logId)
                .getSingleResult();
            assertEquals("TIMEOUT", status.toString());
        });
        assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "IMPERSONATION_TIMEOUT"));
    }
}
