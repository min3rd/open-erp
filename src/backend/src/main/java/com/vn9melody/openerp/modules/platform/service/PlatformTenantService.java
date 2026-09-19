package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.enums.ImpersonationStatus;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.TenantPlanTier;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.UserTenant;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformPage;
import com.vn9melody.openerp.modules.platform.dto.PlatformRequests;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.model.PlatformImpersonationLog;
import com.vn9melody.openerp.modules.platform.repository.PlatformImpersonationLogRepository;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Platform tenant management (FEAT-10 / TASK-202). Every mutation is audited with
 * before/after snapshots inside the same transaction (fail-closed).
 */
@ApplicationScoped
public class PlatformTenantService {

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    AuditLogService auditLogService;

    @Inject
    PlatformGuardService guardService;

    @Inject
    PlatformMailService mailService;

    @Inject
    PlatformImpersonationLogRepository impersonationLogRepository;

    public PlatformPage<PlatformResponses.TenantItem> listTenants(String status, String keyword,
                                                                  int page, int size) {
        StringBuilder query = new StringBuilder("1=1");
        Map<String, Object> params = new HashMap<>();
        if (status != null && !status.isBlank()) {
            TenantStatus tenantStatus = parseStatus(status);
            query.append(" and status = :status");
            params.put("status", tenantStatus);
        }
        if (keyword != null && !keyword.isBlank()) {
            query.append(" and (lower(slug) like :kw or lower(name) like :kw"
                + " or lower(coalesce(taxCode, '')) like :kw)");
            params.put("kw", "%" + keyword.trim().toLowerCase() + "%");
        }

        PanacheQuery<Tenant> panacheQuery = Tenant.find(query.toString(), params);
        long total = panacheQuery.count();
        List<Tenant> tenants = panacheQuery.page(page, size).list();
        List<PlatformResponses.TenantItem> items = new ArrayList<>(tenants.size());
        for (Tenant tenant : tenants) {
            items.add(toItem(tenant));
        }
        return new PlatformPage<>(items, total);
    }

    public PlatformResponses.TenantDetail getTenant(UUID tenantId) {
        Tenant tenant = requireTenant(tenantId);
        PlatformResponses.TenantDetail detail = new PlatformResponses.TenantDetail();
        detail.tenantId = tenant.id.toString();
        detail.slug = tenant.slug;
        detail.name = tenant.name;
        detail.type = tenant.type != null ? tenant.type.name() : null;
        detail.planTier = tenant.planTier != null ? tenant.planTier.name() : null;
        detail.status = tenant.status != null ? tenant.status.name() : null;
        detail.maxUsers = tenant.maxUsers;
        detail.activeUsersCount = countActiveUsers(tenant.id);
        detail.maxStorageMb = tenant.maxStorageMb;
        detail.usedStorageMb = 0L;
        detail.trialEndsAt = tenant.trialEndsAt;
        detail.isLocked = tenant.isLocked;
        detail.lockReason = tenant.lockReason;
        detail.lockedAt = tenant.lockedAt;
        detail.allowedPlugins = tenant.allowedPlugins;
        detail.createdAt = tenant.createdAt;
        return detail;
    }

    @Transactional
    public PlatformResponses.Quota updateQuotas(UUID tenantId, PlatformRequests.QuotaUpdate request,
                                                PlatformActor actor) {
        Tenant tenant = requireTenant(tenantId);
        ObjectNode before = quotaSnapshot(tenant);

        if (request.planTier != null && !request.planTier.isBlank()) {
            try {
                tenant.planTier = TenantPlanTier.valueOf(request.planTier.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Invalid plan_tier");
            }
        }
        long activeUsers = countActiveUsers(tenant.id);
        if (request.maxUsers != null) {
            if (request.maxUsers <= 0) {
                throw new ApiException(400, ErrorCode.VALIDATION_MIN, "max_users must be positive");
            }
            if (request.maxUsers < activeUsers) {
                Map<String, Object> params = new HashMap<>();
                params.put("active_users_count", activeUsers);
                params.put("max_users", request.maxUsers);
                throw new ApiException(409, PlatformErrorCode.PLATFORM_TENANT_QUOTA_EXCEEDED,
                    "Tenant quota is below the current usage", params);
            }
            tenant.maxUsers = request.maxUsers;
        }
        if (request.maxStorageMb != null) {
            if (request.maxStorageMb <= 0) {
                throw new ApiException(400, ErrorCode.VALIDATION_MIN, "max_storage_mb must be positive");
            }
            tenant.maxStorageMb = request.maxStorageMb;
        }
        if (request.allowedPlugins != null && !request.allowedPlugins.isEmpty()) {
            tenant.allowedPlugins = new ArrayList<>(request.allowedPlugins);
        }
        tenant.updatedAt = Instant.now();
        tenant.persist();

        ObjectNode after = quotaSnapshot(tenant);
        ObjectNode details = objectMapper.createObjectNode();
        details.set("before", before);
        details.set("after", after);

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.TENANT_QUOTA_UPDATE.name(), AuditResult.SUCCESS)
            .targetTenant(tenant.id)
            .resource("TENANT", tenant.id)
            .details(details)
            .client(actor.ipAddress, actor.userAgent));

        PlatformResponses.Quota quota = new PlatformResponses.Quota();
        quota.tenantId = tenant.id.toString();
        quota.planTier = tenant.planTier != null ? tenant.planTier.name() : null;
        quota.maxUsers = tenant.maxUsers;
        quota.maxStorageMb = tenant.maxStorageMb;
        quota.allowedPlugins = tenant.allowedPlugins;
        return quota;
    }

    @Transactional
    public PlatformResponses.TenantStatus lockTenant(UUID tenantId, String reason, String confirmPassword,
                                                     PlatformActor actor) {
        guardService.verifyConfirmPassword(actor.userId, confirmPassword);
        Tenant tenant = requireTenant(tenantId);

        if (UserTenant.findByUserAndTenant(actor.userId, tenantId) != null) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_SELF_LOCK_FORBIDDEN,
                "You cannot lock the tenant that owns your account");
        }
        if (hasActiveImpersonation(tenantId)) {
            throw new ApiException(409, PlatformErrorCode.PLATFORM_TENANT_IMPERSONATION_ACTIVE,
                "An impersonation session is currently active for this tenant");
        }

        String previousStatus = tenant.status != null ? tenant.status.name() : null;
        tenant.status = TenantStatus.SUSPENDED;
        tenant.isLocked = true;
        tenant.lockReason = reason;
        tenant.lockedAt = Instant.now();
        tenant.updatedAt = Instant.now();
        tenant.persist();

        ObjectNode details = objectMapper.createObjectNode();
        details.putObject("before").put("status", previousStatus).put("is_locked", false);
        details.putObject("after").put("status", "SUSPENDED").put("is_locked", true);

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.TENANT_LOCK.name(), AuditResult.SUCCESS)
            .targetTenant(tenant.id)
            .resource("TENANT", tenant.id)
            .details(details)
            .reason(reason)
            .client(actor.ipAddress, actor.userAgent));

        notifyTenantOwner(tenant, true, reason);
        return statusResponse(tenant);
    }

    @Transactional
    public PlatformResponses.TenantStatus unlockTenant(UUID tenantId, String confirmPassword, PlatformActor actor) {
        guardService.verifyConfirmPassword(actor.userId, confirmPassword);
        Tenant tenant = requireTenant(tenantId);

        tenant.status = TenantStatus.ACTIVE;
        tenant.isLocked = false;
        tenant.lockReason = null;
        tenant.lockedAt = null;
        tenant.updatedAt = Instant.now();
        tenant.persist();

        ObjectNode details = objectMapper.createObjectNode();
        details.putObject("before").put("status", "SUSPENDED").put("is_locked", true);
        details.putObject("after").put("status", "ACTIVE").put("is_locked", false);

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.TENANT_UNLOCK.name(), AuditResult.SUCCESS)
            .targetTenant(tenant.id)
            .resource("TENANT", tenant.id)
            .details(details)
            .client(actor.ipAddress, actor.userAgent));

        return statusResponse(tenant);
    }

    public Tenant requireTenant(UUID tenantId) {
        Tenant tenant = Tenant.findById(tenantId);
        if (tenant == null) {
            throw new ApiException(404, PlatformErrorCode.PLATFORM_TENANT_NOT_FOUND, "Tenant not found");
        }
        return tenant;
    }

    public long countActiveUsers(UUID tenantId) {
        Object count = entityManager.createNativeQuery(
                "SELECT count(*) FROM user_tenants ut JOIN users u ON u.id = ut.user_id "
                    + "WHERE ut.tenant_id = :tenantId AND u.status = 'ACTIVE'")
            .setParameter("tenantId", tenantId)
            .getSingleResult();
        return count != null ? ((Number) count).longValue() : 0L;
    }

    private boolean hasActiveImpersonation(UUID tenantId) {
        return impersonationLogRepository.count("targetTenantId = ?1 and status = ?2",
            tenantId, ImpersonationStatus.STARTED) > 0;
    }

    public void notifyTenantOwner(Tenant tenant, boolean locked, String reason) {
        String email = findTenantOwnerEmail(tenant.id);
        if (email == null) {
            return;
        }
        if (locked) {
            mailService.sendTenantLockedAlert(email, tenant.name, reason);
        }
    }

    private String findTenantOwnerEmail(UUID tenantId) {
        List<?> rows = entityManager.createNativeQuery("""
                SELECT u.email FROM user_tenants ut
                JOIN users u ON u.id = ut.user_id
                WHERE ut.tenant_id = :tenantId
                  AND ut.role IN ('TENANT_ADMIN', 'ADMIN', 'OWNER')
                ORDER BY ut.joined_at ASC
                LIMIT 1
                """).setParameter("tenantId", tenantId).getResultList();
        return rows.isEmpty() || rows.get(0) == null ? null : rows.get(0).toString();
    }

    private PlatformResponses.TenantItem toItem(Tenant tenant) {
        PlatformResponses.TenantItem item = new PlatformResponses.TenantItem();
        item.tenantId = tenant.id.toString();
        item.slug = tenant.slug;
        item.name = tenant.name;
        item.type = tenant.type != null ? tenant.type.name() : null;
        item.planTier = tenant.planTier != null ? tenant.planTier.name() : null;
        item.status = tenant.status != null ? tenant.status.name() : null;
        item.maxUsers = tenant.maxUsers;
        item.activeUsersCount = countActiveUsers(tenant.id);
        item.maxStorageMb = tenant.maxStorageMb;
        item.usedStorageMb = 0L;
        item.trialEndsAt = tenant.trialEndsAt;
        item.isLocked = tenant.isLocked;
        item.createdAt = tenant.createdAt;
        return item;
    }

    private PlatformResponses.TenantStatus statusResponse(Tenant tenant) {
        PlatformResponses.TenantStatus status = new PlatformResponses.TenantStatus();
        status.tenantId = tenant.id.toString();
        status.status = tenant.status != null ? tenant.status.name() : null;
        status.isLocked = tenant.isLocked;
        status.lockedAt = tenant.lockedAt;
        status.lockReason = tenant.lockReason;
        return status;
    }

    private ObjectNode quotaSnapshot(Tenant tenant) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("plan_tier", tenant.planTier != null ? tenant.planTier.name() : null);
        node.put("max_users", tenant.maxUsers);
        node.put("max_storage_mb", tenant.maxStorageMb);
        node.putPOJO("allowed_plugins", tenant.allowedPlugins);
        return node;
    }

    private TenantStatus parseStatus(String status) {
        try {
            return TenantStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Invalid tenant status filter");
        }
    }
}
