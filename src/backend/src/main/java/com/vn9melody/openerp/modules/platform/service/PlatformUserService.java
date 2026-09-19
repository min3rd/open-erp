package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.core.security.TotpService;
import com.vn9melody.openerp.modules.iam.model.PasswordResetToken;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserTwoFactor;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformPage;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Global platform user management + break-glass operations (FEAT-11 / TASK-273).
 */
@ApplicationScoped
public class PlatformUserService {

    private static final Logger LOG = Logger.getLogger(PlatformUserService.class);
    private static final long RESET_TOKEN_TTL_SECONDS = 900;

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
    SessionManager sessionManager;

    @Inject
    TotpService totpService;

    private final SecureRandom secureRandom = new SecureRandom();

    public PlatformPage<PlatformResponses.UserItem> listUsers(String status, String keyword, UUID tenantId,
                                                              int page, int size) {
        StringBuilder conditions = new StringBuilder(" WHERE 1=1");
        Map<String, Object> params = new HashMap<>();
        if (status != null && !status.isBlank()) {
            AccountStatus accountStatus;
            try {
                accountStatus = AccountStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "Invalid user status filter");
            }
            conditions.append(" AND u.status = :status");
            params.put("status", accountStatus.name());
        }
        if (tenantId != null) {
            conditions.append(" AND ut.tenant_id = :tenantId");
            params.put("tenantId", tenantId);
        }
        if (keyword != null && !keyword.isBlank()) {
            conditions.append(" AND (lower(u.email) LIKE :kw OR lower(coalesce(p.full_name, '')) LIKE :kw)");
            params.put("kw", "%" + keyword.trim().toLowerCase() + "%");
        }

        String baseFrom = " FROM users u"
            + " LEFT JOIN user_profiles p ON p.user_id = u.id"
            + " LEFT JOIN user_tenants ut ON ut.user_id = u.id"
            + " LEFT JOIN user_two_factor tf ON tf.user_id = u.id";

        Query countQuery = entityManager.createNativeQuery("SELECT count(DISTINCT u.id)" + baseFrom + conditions);
        params.forEach(countQuery::setParameter);
        long total = ((Number) countQuery.getSingleResult()).longValue();

        String sql = "SELECT * FROM ("
            + "SELECT DISTINCT ON (u.id) u.id AS user_id, u.email, u.status, p.full_name,"
            + " ut.tenant_id, t.name AS tenant_name, tf.is_enabled, u.created_at"
            + baseFrom
            + " LEFT JOIN tenants t ON t.id = ut.tenant_id"
            + conditions
            + " ORDER BY u.id, ut.joined_at ASC"
            + ") sub ORDER BY created_at DESC, user_id LIMIT :size OFFSET :offset";

        Query query = entityManager.createNativeQuery(sql);
        params.forEach(query::setParameter);
        query.setParameter("size", size);
        query.setParameter("offset", page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<PlatformResponses.UserItem> items = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            PlatformResponses.UserItem item = new PlatformResponses.UserItem();
            item.userId = row[0] != null ? row[0].toString() : null;
            item.email = row[1] != null ? row[1].toString() : null;
            item.status = row[2] != null ? row[2].toString() : null;
            item.fullName = row[3] != null ? row[3].toString() : null;
            item.tenantId = row[4] != null ? row[4].toString() : null;
            item.tenantName = row[5] != null ? row[5].toString() : null;
            item.is2FaEnabled = row[6] != null && Boolean.TRUE.equals(row[6]);
            item.lastLoginAt = null;
            items.add(item);
        }
        return new PlatformPage<>(items, total);
    }

    @Transactional
    public PlatformResponses.UserStatus lockUser(UUID userId, String reason, PlatformActor actor) {
        if (userId.equals(actor.userId)) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_SELF_DISABLE_FORBIDDEN,
                "You cannot lock your own account");
        }
        User user = requireUser(userId);
        String previousStatus = user.status != null ? user.status.name() : null;
        user.status = AccountStatus.LOCKED;
        user.updatedAt = Instant.now();
        user.persist();
        sessionManager.revokeAllSessions(user.id);

        ObjectNode details = objectMapper.createObjectNode();
        details.putObject("before").put("status", previousStatus);
        details.putObject("after").put("status", "LOCKED");

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.USER_GLOBAL_LOCK.name(), AuditResult.SUCCESS)
            .targetUser(user.id)
            .resource("USER", user.id)
            .details(details)
            .reason(reason)
            .client(actor.ipAddress, actor.userAgent));

        PlatformResponses.UserStatus status = new PlatformResponses.UserStatus();
        status.userId = user.id.toString();
        status.status = "LOCKED";
        status.lockedAt = Instant.now();
        return status;
    }

    @Transactional
    public PlatformResponses.UserStatus unlockUser(UUID userId, PlatformActor actor) {
        User user = requireUser(userId);
        user.status = AccountStatus.ACTIVE;
        user.updatedAt = Instant.now();
        user.persist();

        ObjectNode details = objectMapper.createObjectNode();
        details.putObject("before").put("status", "LOCKED");
        details.putObject("after").put("status", "ACTIVE");

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.USER_GLOBAL_UNLOCK.name(), AuditResult.SUCCESS)
            .targetUser(user.id)
            .resource("USER", user.id)
            .details(details)
            .client(actor.ipAddress, actor.userAgent));

        PlatformResponses.UserStatus status = new PlatformResponses.UserStatus();
        status.userId = user.id.toString();
        status.status = "ACTIVE";
        return status;
    }

    @Transactional
    public PlatformResponses.UserReset forcePasswordReset(UUID userId, String reason, PlatformActor actor) {
        User user = requireUser(userId);
        issueResetToken(user);

        ObjectNode details = objectMapper.createObjectNode();
        details.put("reset_token_sent", true);

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.USER_FORCE_PASSWORD_RESET.name(), AuditResult.SUCCESS)
            .targetUser(user.id)
            .resource("USER", user.id)
            .details(details)
            .reason(reason)
            .client(actor.ipAddress, actor.userAgent));

        PlatformResponses.UserReset response = new PlatformResponses.UserReset();
        response.userId = user.id.toString();
        response.resetTokenSent = true;
        return response;
    }

    @Transactional
    public PlatformResponses.BreakGlassResult breakGlass(UUID userId, String action, String supportTicket,
                                                         String reason, String confirmPassword, PlatformActor actor) {
        guardService.verifyConfirmPassword(actor.userId, confirmPassword);
        if (supportTicket == null || supportTicket.isBlank()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, "support_ticket is required",
                Map.of("field", "support_ticket"));
        }
        String normalized = action == null ? "" : action.trim().toUpperCase();
        User user = requireUser(userId);
        PlatformResponses.BreakGlassResult result = new PlatformResponses.BreakGlassResult();
        result.userId = user.id.toString();
        result.action = normalized;

        switch (normalized) {
            case "FORCE_PASSWORD_RESET" -> {
                issueResetToken(user);
                result.resetTokenSent = true;
                auditLogService.record(AuditLogEntry
                    .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                        PlatformAction.USER_FORCE_PASSWORD_RESET.name(), AuditResult.SUCCESS)
                    .targetUser(user.id)
                    .resource("USER", user.id)
                    .details(breakGlassDetails(supportTicket, "FORCE_PASSWORD_RESET"))
                    .reason(reason)
                    .client(actor.ipAddress, actor.userAgent));
                mailService.sendUserBreakGlassAlert(user.email, "FORCE_PASSWORD_RESET", supportTicket);
            }
            case "DISABLE_2FA" -> {
                UserTwoFactor twoFactor = UserTwoFactor.findByUserId(user.id);
                if (twoFactor != null) {
                    twoFactor.delete();
                }
                result.is2FaEnabled = false;
                auditLogService.record(AuditLogEntry
                    .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                        PlatformAction.USER_BREAK_GLASS_DISABLE_2FA.name(), AuditResult.SUCCESS)
                    .targetUser(user.id)
                    .resource("USER", user.id)
                    .details(breakGlassDetails(supportTicket, "DISABLE_2FA"))
                    .reason(reason)
                    .client(actor.ipAddress, actor.userAgent));
                mailService.sendUserBreakGlassAlert(user.email, "DISABLE_2FA", supportTicket);
            }
            default -> throw new ApiException(400, ErrorCode.VALIDATION_INVALID,
                "action must be one of FORCE_PASSWORD_RESET or DISABLE_2FA");
        }
        return result;
    }

    private ObjectNode breakGlassDetails(String supportTicket, String action) {
        ObjectNode details = objectMapper.createObjectNode();
        details.put("support_ticket", supportTicket);
        details.put("break_glass_action", action);
        return details;
    }

    private void issueResetToken(User user) {
        PasswordResetToken.delete("user.id = ?1 and usedAt is null", user.id);
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        StringBuilder raw = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            raw.append(String.format("%02x", b));
        }
        PasswordResetToken token = new PasswordResetToken();
        token.user = user;
        token.tokenHash = totpService.sha256Hex(raw.toString());
        token.expiresAt = Instant.now().plusSeconds(RESET_TOKEN_TTL_SECONDS);
        token.persist();
        mailService.sendAdminPasswordReset(user.email, raw.toString());
    }

    public User requireUser(UUID userId) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(404, PlatformErrorCode.PLATFORM_USER_NOT_FOUND, "User not found");
        }
        return user;
    }
}
