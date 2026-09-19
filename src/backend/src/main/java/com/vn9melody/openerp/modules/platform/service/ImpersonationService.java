package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.enums.ImpersonationStatus;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.iam.model.UserTenant;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformPage;
import com.vn9melody.openerp.modules.platform.dto.PlatformRequests;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.model.PlatformImpersonationLog;
import com.vn9melody.openerp.modules.platform.repository.PlatformImpersonationLogRepository;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.value.ValueCommands;
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
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

/**
 * Impersonation ("login-as") lifecycle (FEAT-11 / SOL-01 section 2): start, exit
 * and log listing. Target selection follows BUG-57 (TENANT_OWNER first, then the
 * first TENANT_ADMIN by assigned_at).
 */
@ApplicationScoped
public class ImpersonationService {

    private static final Logger LOG = Logger.getLogger(ImpersonationService.class);

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    AuditLogService auditLogService;

    @Inject
    PlatformGuardService guardService;

    @Inject
    PlatformJwtService platformJwtService;

    @Inject
    SessionManager sessionManager;

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Inject
    PlatformImpersonationLogRepository impersonationLogRepository;

    @Inject
    RedisDataSource redis;

    @Transactional
    public PlatformResponses.ImpersonationStart start(UUID tenantId, PlatformRequests.Impersonate request,
                                                      PlatformActor actor) {
        guardService.verifyConfirmPassword(actor.userId, request.confirmPassword);
        if (request.supportTicket == null || request.supportTicket.isBlank()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, "support_ticket is required",
                Map.of("field", "support_ticket"));
        }
        if (request.reason == null || request.reason.isBlank()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, "reason is required",
                Map.of("field", "reason"));
        }

        Tenant tenant = Tenant.findById(tenantId);
        if (tenant == null) {
            throw new ApiException(404, PlatformErrorCode.PLATFORM_TENANT_NOT_FOUND, "Tenant not found");
        }
        if (isTenantUnavailable(tenant)) {
            throw new ApiException(409, PlatformErrorCode.PLATFORM_IMPERSONATION_TENANT_LOCKED,
                "Tenant is locked or unavailable for impersonation");
        }

        UUID targetUserId = resolveTargetUser(tenantId, request.targetUserId);
        User targetUser = User.findById(targetUserId);
        if (targetUser == null) {
            throw new ApiException(400, PlatformErrorCode.PLATFORM_IMPERSONATION_TARGET_NOT_FOUND,
                "Impersonation target user not found");
        }
        if (superAdminRepository.findByUserId(targetUserId) != null) {
            throw new ApiException(400, PlatformErrorCode.PLATFORM_IMPERSONATION_TARGET_NOT_FOUND,
                "Platform administrators cannot be impersonated");
        }

        UserTenant membership = UserTenant.findByUserAndTenant(targetUserId, tenantId);
        if (membership == null) {
            throw new ApiException(400, PlatformErrorCode.PLATFORM_IMPERSONATION_TARGET_NOT_FOUND,
                "Impersonation target is not a member of the tenant");
        }

        PlatformImpersonationLog log = new PlatformImpersonationLog();
        log.superAdminUserId = actor.userId;
        log.targetTenantId = tenantId;
        log.targetUserId = targetUserId;
        log.reason = request.reason;
        log.supportTicket = request.supportTicket;
        log.ipAddress = actor.ipAddress;
        log.userAgent = actor.userAgent;
        log.startedAt = Instant.now();
        log.status = ImpersonationStatus.STARTED;
        log.persist();

        // BUG-75: register a real Redis session for the target user and bind its id
        // into the impersonation JWT so organization/IAM session filters accept it.
        String sessionId = sessionManager.createSession(targetUserId, "Impersonation: " + actor.email, actor.ipAddress);

        String role = membership.role != null ? membership.role.name() : "MEMBER";
        String token = platformJwtService.generateImpersonationToken(
            targetUserId, targetUser.email, tenantId, role, actor.userId, actor.email, log.id,
            request.supportTicket, sessionId);

        // Redis impersonation marker; exiting deletes the marker and revokes the session.
        ObjectNode sessionPayload = objectMapper.createObjectNode();
        sessionPayload.put("super_admin_id", actor.userId.toString());
        sessionPayload.put("tenant_id", tenantId.toString());
        sessionPayload.put("target_user_id", targetUserId.toString());
        sessionPayload.put("session_id", sessionId);
        sessionPayload.put("started_at", log.startedAt.toString());
        valueCommands().setex(impersonationKey(log.id), PlatformJwtService.IMPERSONATION_TTL_SECONDS,
            sessionPayload.toString());

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.IMPERSONATION_START.name(), AuditResult.SUCCESS)
            .targetTenant(tenant.id)
            .targetUser(targetUserId)
            .resource("IMPERSONATION", log.id)
            .details(impersonationDetails(log))
            .reason(request.reason)
            .client(actor.ipAddress, actor.userAgent));

        PlatformResponses.ImpersonationStart response = new PlatformResponses.ImpersonationStart();
        response.impersonationToken = token;
        response.expiresInSeconds = (int) PlatformJwtService.IMPERSONATION_TTL_SECONDS;
        response.targetTenantId = tenant.id.toString();
        response.targetTenantName = tenant.name;
        response.targetUserId = targetUserId.toString();
        response.targetUserEmail = targetUser.email;
        response.startedAt = log.startedAt;
        return response;
    }

    @Transactional
    public void exit(JsonWebToken impersonationJwt) {
        String impersonationIdClaim = impersonationJwt.getClaim(PlatformJwtService.CLAIM_IMPERSONATION_ID);
        if (!com.vn9melody.openerp.modules.platform.api.PlatformSupport.booleanClaim(
                impersonationJwt, PlatformJwtService.CLAIM_IS_IMPERSONATION)
                || impersonationIdClaim == null) {
            throw new ApiException(401, PlatformErrorCode.PLATFORM_IMPERSONATION_SESSION_EXPIRED,
                "Impersonation session expired or not found");
        }
        UUID impersonationId;
        try {
            impersonationId = UUID.fromString(impersonationIdClaim);
        } catch (IllegalArgumentException e) {
            throw new ApiException(401, PlatformErrorCode.PLATFORM_IMPERSONATION_SESSION_EXPIRED,
                "Impersonation session expired or not found");
        }

        String marker = valueCommands().get(impersonationKey(impersonationId));
        if (marker == null) {
            throw new ApiException(401, PlatformErrorCode.PLATFORM_IMPERSONATION_SESSION_EXPIRED,
                "Impersonation session expired or not found");
        }
        redis.key(String.class).del(impersonationKey(impersonationId));

        // BUG-75: exit must also invalidate the delegated Redis session, otherwise the
        // impersonation token would stay usable until its own expiry.
        String sessionId = sessionId(impersonationJwt, marker);
        UUID targetUserId = parseSubject(impersonationJwt);
        if (sessionId != null && targetUserId != null) {
            sessionManager.revokeSession(targetUserId, sessionId);
        }

        PlatformImpersonationLog log = impersonationLogRepository.find("id", impersonationId).firstResult();
        if (log != null && log.status == ImpersonationStatus.STARTED) {
            log.status = ImpersonationStatus.ENDED;
            log.endedAt = Instant.now();
            log.persist();

            UUID actorUserId = null;
            String actorEmail = null;
            try {
                actorUserId = UUID.fromString(impersonationJwt.getClaim(PlatformJwtService.CLAIM_ACT_SUB));
                actorEmail = impersonationJwt.getClaim(PlatformJwtService.CLAIM_ACT_EMAIL);
            } catch (Exception ignored) {
                // Malformed actor claim: audit still records the target tenant.
            }

            ObjectNode details = objectMapper.createObjectNode();
            details.put("support_ticket", log.supportTicket);
            details.put("target_user_id", log.targetUserId.toString());

            auditLogService.record(AuditLogEntry
                .of(AuditScope.PLATFORM, null,
                    com.vn9melody.openerp.core.enums.ActorType.SUPER_ADMIN, actorUserId,
                    PlatformAction.IMPERSONATION_END.name(), AuditResult.SUCCESS)
                .actorEmail(actorEmail)
                .targetTenant(log.targetTenantId)
                .targetUser(log.targetUserId)
                .resource("IMPERSONATION", log.id)
                .details(details)
                .client("unknown", null));
        }
    }

    /**
     * BUG-78 / TC-BE-19: idempotently closes every STARTED impersonation log whose
     * TTL (1800s) elapsed without a proper {@code exit}, marking it {@code TIMEOUT}
     * and emitting a SYSTEM audit entry. Returns the number of closed sessions.
     */
    @Transactional
    public int closeExpiredSessions(Instant now) {
        return closeExpiredSessions(now, null);
    }

    /**
     * Tenant-scoped variant used by the emergency tenant lock: closes the target
     * tenant's overdue sessions before checking for a live one (exact same
     * idempotent logic).
     */
    @Transactional
    public int closeExpiredSessions(Instant now, UUID tenantId) {
        Instant threshold = now.minusSeconds(PlatformJwtService.IMPERSONATION_TTL_SECONDS);
        List<PlatformImpersonationLog> expired = tenantId == null
            ? impersonationLogRepository.find("status = ?1 and startedAt < ?2 order by startedAt asc",
                ImpersonationStatus.STARTED, threshold).list()
            : impersonationLogRepository.find(
                "status = ?1 and startedAt < ?2 and targetTenantId = ?3 order by startedAt asc",
                ImpersonationStatus.STARTED, threshold, tenantId).list();

        int closed = 0;
        for (PlatformImpersonationLog log : expired) {
            closeExpiredSession(log, now);
            closed++;
        }
        if (closed > 0) {
            LOG.infof("Impersonation timeout: %d overdue session(s) moved to TIMEOUT", closed);
        }
        return closed;
    }

    private void closeExpiredSession(PlatformImpersonationLog log, Instant now) {
        log.status = ImpersonationStatus.TIMEOUT;
        log.endedAt = now;
        log.persist();

        // Best effort: the Redis marker normally expires together with the token, but
        // when it is still alive the delegated session is revoked immediately.
        String marker = valueCommands().get(impersonationKey(log.id));
        String sessionId = marker != null ? sessionIdFromMarker(marker) : null;
        if (marker != null) {
            redis.key(String.class).del(impersonationKey(log.id));
        }
        if (sessionId != null) {
            sessionManager.revokeSession(log.targetUserId, sessionId);
        }

        ObjectNode details = objectMapper.createObjectNode();
        details.put("support_ticket", log.supportTicket);
        details.put("target_user_id", log.targetUserId.toString());
        details.put("timed_out_at", now.toString());

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, ActorType.SYSTEM, log.superAdminUserId,
                PlatformAction.IMPERSONATION_TIMEOUT.name(), AuditResult.SUCCESS)
            .targetTenant(log.targetTenantId)
            .targetUser(log.targetUserId)
            .resource("IMPERSONATION", log.id)
            .details(details)
            .reason("Impersonation session exceeded the "
                + PlatformJwtService.IMPERSONATION_TTL_SECONDS + "s TTL without exit")
            .client("local-console", "impersonation-timeout-job"));
    }

    public PlatformPage<PlatformResponses.ImpersonationLogItem> listLogs(UUID superAdminUserId, UUID tenantId,
                                                                          String status, int page, int size) {
        StringBuilder query = new StringBuilder("1=1");
        Map<String, Object> params = new HashMap<>();
        if (superAdminUserId != null) {
            query.append(" and superAdminUserId = :adminId");
            params.put("adminId", superAdminUserId);
        }
        if (tenantId != null) {
            query.append(" and targetTenantId = :tenantId");
            params.put("tenantId", tenantId);
        }
        if (status != null && !status.isBlank()) {
            try {
                params.put("status", ImpersonationStatus.valueOf(status.trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Invalid impersonation status filter");
            }
            query.append(" and status = :status");
        }

        PanacheQuery<PlatformImpersonationLog> panacheQuery =
            PlatformImpersonationLog.find(query + " order by startedAt desc", params);
        long total = panacheQuery.count();
        List<PlatformImpersonationLog> logs = panacheQuery.page(page, size).list();
        List<PlatformResponses.ImpersonationLogItem> items = new ArrayList<>(logs.size());
        for (PlatformImpersonationLog log : logs) {
            items.add(toItem(log));
        }
        return new PlatformPage<>(items, total);
    }

    private PlatformResponses.ImpersonationLogItem toItem(PlatformImpersonationLog log) {
        PlatformResponses.ImpersonationLogItem item = new PlatformResponses.ImpersonationLogItem();
        item.logId = log.id.toString();
        item.superAdminUserId = log.superAdminUserId != null ? log.superAdminUserId.toString() : null;
        item.superAdminEmail = resolveEmail(log.superAdminUserId);
        item.targetTenantId = log.targetTenantId != null ? log.targetTenantId.toString() : null;
        item.targetUserId = log.targetUserId != null ? log.targetUserId.toString() : null;
        item.supportTicket = log.supportTicket;
        item.status = log.status != null ? log.status.name() : null;
        item.startedAt = log.startedAt;
        item.endedAt = log.endedAt;
        return item;
    }

    private UUID resolveTargetUser(UUID tenantId, String requestedTargetUserId) {
        if (requestedTargetUserId != null && !requestedTargetUserId.isBlank()) {
            UUID targetUserId;
            try {
                targetUserId = UUID.fromString(requestedTargetUserId.trim());
            } catch (IllegalArgumentException e) {
                throw new ApiException(400, PlatformErrorCode.PLATFORM_IMPERSONATION_TARGET_NOT_FOUND,
                    "Impersonation target user not found");
            }
            if (UserTenant.findByUserAndTenant(targetUserId, tenantId) == null) {
                throw new ApiException(400, PlatformErrorCode.PLATFORM_IMPERSONATION_TARGET_NOT_FOUND,
                    "Impersonation target user not found in tenant");
            }
            return targetUserId;
        }

        List<?> rows = entityManager.createNativeQuery("""
                SELECT ut.user_id FROM user_tenants ut
                LEFT JOIN user_roles ur ON ur.user_id = ut.user_id AND ur.tenant_id = ut.tenant_id
                LEFT JOIN roles r ON r.id = ur.role_id
                WHERE ut.tenant_id = :tenantId
                ORDER BY CASE
                    WHEN r.code = 'TENANT_OWNER' THEN 0
                    WHEN r.code = 'TENANT_ADMIN' THEN 1
                    WHEN ut.role IN ('TENANT_OWNER', 'OWNER') THEN 0
                    WHEN ut.role IN ('TENANT_ADMIN', 'ADMIN') THEN 1
                    ELSE 2 END, ut.joined_at ASC
                LIMIT 1
                """).setParameter("tenantId", tenantId).getResultList();
        if (rows.isEmpty() || rows.get(0) == null) {
            throw new ApiException(400, PlatformErrorCode.PLATFORM_IMPERSONATION_TARGET_NOT_FOUND,
                "No impersonation target user found for tenant");
        }
        return UUID.fromString(rows.get(0).toString());
    }

    private boolean isTenantUnavailable(Tenant tenant) {
        if (Boolean.TRUE.equals(tenant.isLocked)) {
            return true;
        }
        return tenant.status == TenantStatus.SUSPENDED
            || tenant.status == TenantStatus.EXPIRED
            || tenant.status == TenantStatus.DELETED;
    }

    private ObjectNode impersonationDetails(PlatformImpersonationLog log) {
        ObjectNode details = objectMapper.createObjectNode();
        details.put("support_ticket", log.supportTicket);
        details.put("target_user_id", log.targetUserId.toString());
        details.put("super_admin_user_id", log.superAdminUserId.toString());
        return details;
    }

    private String resolveEmail(UUID userId) {
        if (userId == null) {
            return null;
        }
        List<?> rows = entityManager.createNativeQuery("SELECT email FROM users WHERE id = :id")
            .setParameter("id", userId).getResultList();
        return rows.isEmpty() || rows.get(0) == null ? null : rows.get(0).toString();
    }

    private String impersonationKey(UUID impersonationId) {
        return "impersonation:session:" + impersonationId;
    }

    /** Session id from the JWT claim, falling back to the Redis marker payload. */
    private String sessionId(JsonWebToken jwt, String marker) {
        String claim = jwt != null ? jwt.getClaim(PlatformJwtService.CLAIM_SESSION_ID) : null;
        if (claim != null && !claim.isBlank()) {
            return claim;
        }
        return marker != null ? sessionIdFromMarker(marker) : null;
    }

    private String sessionIdFromMarker(String marker) {
        try {
            String value = objectMapper.readTree(marker).path("session_id").asText(null);
            return value != null && !value.isBlank() ? value : null;
        } catch (Exception e) {
            return null;
        }
    }

    private UUID parseSubject(JsonWebToken jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (Exception e) {
            return null;
        }
    }

    private ValueCommands<String, String> valueCommands() {
        return redis.value(String.class);
    }
}
