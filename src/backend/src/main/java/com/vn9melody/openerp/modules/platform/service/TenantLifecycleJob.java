package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Tenant lifecycle automation (TASK-272 / BR-SA-05): TRIAL past {@code trial_ends_at}
 * becomes EXPIRED; PENDING_DELETION past the grace period becomes DELETED (soft - no
 * hard data deletion). Idempotent and audited with {@code actor_type = SYSTEM}.
 */
@ApplicationScoped
public class TenantLifecycleJob {

    private static final Logger LOG = Logger.getLogger(TenantLifecycleJob.class);

    public static class LifecycleResult {
        public int expired;
        public int deleted;
    }

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    AuditLogService auditLogService;

    @Inject
    PlatformMailService mailService;

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Inject
    Vertx vertx;

    @ConfigProperty(name = "openerp.platform.lifecycle.jobs-enabled", defaultValue = "true")
    boolean jobsEnabled;

    @ConfigProperty(name = "openerp.platform.lifecycle.interval-seconds", defaultValue = "86400")
    long intervalSeconds;

    @ConfigProperty(name = "openerp.platform.deletion-grace-days", defaultValue = "30")
    long deletionGraceDays;

    void onStart(@Observes StartupEvent event) {
        if (!jobsEnabled) {
            return;
        }
        vertx.setPeriodic(intervalSeconds * 1000L, id -> runOnce());
    }

    /**
     * BUG-82: runs one lifecycle pass on a Vert.x worker thread. The periodic timer fires
     * on the event loop, where a JTA transaction cannot start, so the transaction is
     * opened inside the worker callback. Failures are logged and swallowed so a bad tick
     * never kills the scheduler.
     */
    public Future<LifecycleResult> runOnce() {
        return vertx.executeBlocking(() -> {
            try {
                return QuarkusTransaction.requiringNew().call(() -> runLifecycle(Instant.now()));
            } catch (Exception e) {
                LOG.errorf("Tenant lifecycle job failed: %s", e.getMessage());
                return null;
            }
        });
    }

    @Transactional
    public LifecycleResult runLifecycle(Instant now) {
        LifecycleResult result = new LifecycleResult();
        result.expired = expireTrials(now);
        result.deleted = finalizeDeletions(now);
        return result;
    }

    @Transactional
    public int expireTrials(Instant now) {
        List<Tenant> trials = Tenant.list("status = ?1 and trialEndsAt is not null and trialEndsAt < ?2",
            TenantStatus.TRIAL, now);
        int expired = 0;
        for (Tenant tenant : trials) {
            tenant.status = TenantStatus.EXPIRED;
            tenant.updatedAt = now;
            tenant.persist();
            expired++;
            recordSystemAudit(tenant, PlatformAuditActions.TENANT_AUTO_EXPIRED,
                "Trial period ended at " + tenant.trialEndsAt);
            String ownerEmail = findTenantOwnerEmail(tenant.id);
            mailService.sendTenantExpiredAlert(ownerEmail, tenant.name);
        }
        if (expired > 0) {
            LOG.infof("Tenant lifecycle: %d TRIAL tenant(s) moved to EXPIRED", expired);
        }
        return expired;
    }

    @Transactional
    public int finalizeDeletions(Instant now) {
        Instant threshold = now.minus(deletionGraceDays, ChronoUnit.DAYS);
        List<Tenant> pending = Tenant.list("status = ?1 and updatedAt < ?2",
            TenantStatus.PENDING_DELETION, threshold);
        int deleted = 0;
        for (Tenant tenant : pending) {
            tenant.status = TenantStatus.DELETED;
            tenant.isLocked = true;
            tenant.updatedAt = now;
            tenant.persist();
            deleted++;
            recordSystemAudit(tenant, PlatformAuditActions.TENANT_AUTO_DELETED,
                "Grace period of " + deletionGraceDays + " days elapsed");
        }
        if (deleted > 0) {
            LOG.warnf("Tenant lifecycle: %d tenant(s) marked DELETED (soft)", deleted);
        }
        return deleted;
    }

    private void recordSystemAudit(Tenant tenant, String action, String reason) {
        UUID actorUserId = findTenantOwnerUserId(tenant.id);
        if (actorUserId == null) {
            // Fall back to the oldest active platform admin so SYSTEM entries keep the FK invariant.
            var admins = superAdminRepository.list(
                "role = ?1 and status = ?2 order by createdAt asc", PlatformAdminRole.SUPER_ADMIN,
                PlatformAdminStatus.ACTIVE);
            if (!admins.isEmpty()) {
                actorUserId = admins.get(0).userId;
            }
        }
        if (actorUserId == null) {
            LOG.warnf("No actor user available for SYSTEM audit of tenant %s; entry skipped", tenant.id);
            return;
        }
        ObjectNode details = objectMapper.createObjectNode();
        details.put("previous_status", action.equals(PlatformAuditActions.TENANT_AUTO_EXPIRED) ? "TRIAL" : "PENDING_DELETION");
        details.put("new_status", tenant.status.name());
        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, ActorType.SYSTEM, actorUserId, action, AuditResult.SUCCESS)
            .targetTenant(tenant.id)
            .resource("TENANT", tenant.id)
            .details(details)
            .reason(reason)
            .client("local-console", "tenant-lifecycle-job"));
    }

    private String findTenantOwnerEmail(UUID tenantId) {
        List<?> rows = entityManager.createNativeQuery("""
                SELECT u.email FROM user_tenants ut
                JOIN users u ON u.id = ut.user_id
                WHERE ut.tenant_id = :tenantId
                  AND ut.role IN ('TENANT_ADMIN', 'ADMIN', 'OWNER')
                ORDER BY ut.joined_at ASC LIMIT 1
                """).setParameter("tenantId", tenantId).getResultList();
        return rows.isEmpty() || rows.get(0) == null ? null : rows.get(0).toString();
    }

    private UUID findTenantOwnerUserId(UUID tenantId) {
        List<?> rows = entityManager.createNativeQuery("""
                SELECT ut.user_id FROM user_tenants ut
                WHERE ut.tenant_id = :tenantId
                  AND ut.role IN ('TENANT_ADMIN', 'ADMIN', 'OWNER')
                ORDER BY ut.joined_at ASC LIMIT 1
                """).setParameter("tenantId", tenantId).getResultList();
        if (!rows.isEmpty() && rows.get(0) != null) {
            return UUID.fromString(rows.get(0).toString());
        }
        List<?> anyMember = entityManager.createNativeQuery(
                "SELECT user_id FROM user_tenants WHERE tenant_id = :tenantId ORDER BY joined_at ASC LIMIT 1")
            .setParameter("tenantId", tenantId).getResultList();
        return anyMember.isEmpty() || anyMember.get(0) == null
            ? null : UUID.fromString(anyMember.get(0).toString());
    }
}
