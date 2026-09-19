package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.core.security.TotpService;
import com.vn9melody.openerp.modules.iam.model.PasswordResetToken;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.iam.model.UserTwoFactor;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformRequests;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.jboss.logging.Logger;

/**
 * Platform admin lifecycle API (FEAT-18 / TASK-294): grant, list, disable, enable,
 * revoke, reset-password and break-glass 2FA removal. Guards self-disable and
 * last-active-admin with a row lock to prevent races.
 */
@ApplicationScoped
public class PlatformAdminService {

    private static final Logger LOG = Logger.getLogger(PlatformAdminService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final long RESET_TOKEN_TTL_SECONDS = 900;

    public static class GrantOutcome {
        public PlatformSuperAdmin admin;
        public PlatformResponses.AdminMutation response;
        public boolean invitationSent;
    }

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Inject
    AuditLogService auditLogService;

    @Inject
    PlatformGuardService guardService;

    @Inject
    PlatformMailService mailService;

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    SessionManager sessionManager;

    @Inject
    TotpService totpService;

    private final SecureRandom secureRandom = new SecureRandom();

    public List<PlatformResponses.AdminItem> listAdmins() {
        List<PlatformSuperAdmin> admins = superAdminRepository.list("order by createdAt asc");
        Set<UUID> enabledTwoFactor = enabledTwoFactorUsers();
        List<PlatformResponses.AdminItem> items = new ArrayList<>(admins.size());
        for (PlatformSuperAdmin admin : admins) {
            items.add(toItem(admin, enabledTwoFactor.contains(admin.userId)));
        }
        return items;
    }

    @Transactional
    public GrantOutcome grant(PlatformRequests.AdminGrant request, PlatformActor actor) {
        if (request.email == null || !EMAIL_PATTERN.matcher(request.email.trim().toLowerCase()).matches()) {
            throw new ApiException(400, ErrorCode.VALIDATION_EMAIL, "A valid email is required",
                Map.of("field", "email"));
        }
        PlatformAdminRole role = PlatformAdminRole.fromString(request.role);
        if (request.role == null || !role.name().equalsIgnoreCase(request.role.trim())) {
            throw new ApiException(400, ErrorCode.VALIDATION_INVALID, "role must be SUPER_ADMIN or SUPPORT_ENGINEER",
                Map.of("field", "role"));
        }

        String email = request.email.trim().toLowerCase();
        User user = User.findByEmail(email);
        boolean newUser = user == null;
        if (newUser) {
            user = new User();
            user.email = email;
            user.status = AccountStatus.ACTIVE;
            user.emailVerifiedAt = Instant.now();
            user.persist();

            UserCredential credential = new UserCredential();
            credential.user = user;
            credential.userId = user.id;
            credential.passwordHash = passwordHashService.hashPassword(generateTemporaryPassword());
            credential.persist();

            UserProfile profile = new UserProfile();
            profile.user = user;
            profile.userId = user.id;
            profile.fullName = request.fullName != null && !request.fullName.isBlank()
                ? request.fullName.trim() : email;
            profile.persist();
        }

        PlatformSuperAdmin admin = superAdminRepository.findByUserId(user.id);
        boolean newAdmin = admin == null;
        if (newAdmin) {
            admin = new PlatformSuperAdmin();
            admin.userId = user.id;
        }
        String previousStatus = newAdmin ? null : (admin.status != null ? admin.status.name() : null);
        String previousRole = newAdmin ? null : (admin.role != null ? admin.role.name() : null);
        admin.role = role;
        admin.status = newUser ? PlatformAdminStatus.INVITED : PlatformAdminStatus.ACTIVE;
        admin.isActive = admin.status == PlatformAdminStatus.ACTIVE;
        admin.mustChangePassword = true;
        admin.twoFactorRequired = true;
        admin.disabledAt = null;
        admin.disabledBy = null;
        admin.grantedBy = actor.userId;
        admin.updatedAt = Instant.now();
        admin.persist();

        ObjectNode details = objectMapper.createObjectNode();
        ObjectNode before = details.putObject("before");
        before.put("status", previousStatus);
        before.put("role", previousRole);
        ObjectNode after = details.putObject("after");
        after.put("status", admin.status.name());
        after.put("role", admin.role.name());
        after.put("user_created", newUser);

        GrantOutcome outcome = new GrantOutcome();
        outcome.admin = admin;
        outcome.response = mutation(admin, false);
        outcome.invitationSent = newUser;

        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.PLATFORM_ADMIN_GRANTED.name(), AuditResult.SUCCESS)
            .targetUser(user.id)
            .resource("PLATFORM_ADMIN", admin.id)
            .details(details)
            .client(actor.ipAddress, actor.userAgent));

        if (newUser) {
            mailService.sendAdminInvitation(email, role.name(), request.fullName);
        }
        return outcome;
    }

    @Transactional
    public PlatformResponses.AdminMutation disable(UUID adminId, String reason, String confirmPassword,
                                                   PlatformActor actor) {
        guardService.verifyConfirmPassword(actor.userId, confirmPassword);
        PlatformSuperAdmin admin = requireAdmin(adminId);
        if (admin.userId.equals(actor.userId)) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_SELF_DISABLE_FORBIDDEN,
                "You cannot disable or revoke your own platform admin account");
        }
        assertNotLastActiveSuperAdmin(admin);

        admin.status = PlatformAdminStatus.DISABLED;
        admin.isActive = false;
        admin.disabledAt = Instant.now();
        admin.disabledBy = actor.userId;
        admin.updatedAt = Instant.now();
        admin.persist();
        sessionManager.revokeAllSessions(admin.userId);

        auditAdminChange(admin, PlatformAction.PLATFORM_ADMIN_DISABLED, actor, reason, "ACTIVE", "DISABLED");
        String email = resolveEmail(admin.userId);
        mailService.sendAdminDisabledAlert(email, reason);

        return mutation(admin, false);
    }

    @Transactional
    public PlatformResponses.AdminMutation enable(UUID adminId, PlatformActor actor) {
        PlatformSuperAdmin admin = requireAdmin(adminId);
        if (admin.status == PlatformAdminStatus.REVOKED) {
            throw new ApiException(409, PlatformErrorCode.PLATFORM_LAST_ADMIN_PROTECTED,
                "REVOKED platform admins are terminal; grant the role again instead");
        }
        String previous = admin.status != null ? admin.status.name() : null;
        admin.status = PlatformAdminStatus.ACTIVE;
        admin.isActive = true;
        admin.disabledAt = null;
        admin.disabledBy = null;
        admin.updatedAt = Instant.now();
        admin.persist();

        auditAdminChange(admin, PlatformAction.PLATFORM_ADMIN_ENABLED, actor, null, previous, "ACTIVE");
        return mutation(admin, false);
    }

    @Transactional
    public PlatformResponses.AdminMutation revoke(UUID adminId, String reason, PlatformActor actor) {
        PlatformSuperAdmin admin = requireAdmin(adminId);
        if (admin.userId.equals(actor.userId)) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_SELF_DISABLE_FORBIDDEN,
                "You cannot disable or revoke your own platform admin account");
        }
        assertNotLastActiveSuperAdmin(admin);

        String previous = admin.status != null ? admin.status.name() : null;
        admin.status = PlatformAdminStatus.REVOKED;
        admin.isActive = false;
        admin.disabledAt = Instant.now();
        admin.disabledBy = actor.userId;
        admin.updatedAt = Instant.now();
        admin.persist();
        sessionManager.revokeAllSessions(admin.userId);

        auditAdminChange(admin, PlatformAction.PLATFORM_ADMIN_REVOKED, actor, reason, previous, "REVOKED");
        return mutation(admin, false);
    }

    @Transactional
    public PlatformResponses.AdminMutation resetPassword(UUID adminId, PlatformActor actor) {
        PlatformSuperAdmin admin = requireAdmin(adminId);
        admin.mustChangePassword = true;
        admin.updatedAt = Instant.now();
        admin.persist();

        User user = User.findById(admin.userId);
        issueResetToken(user);

        ObjectNode details = objectMapper.createObjectNode();
        details.put("reset_token_sent", true);
        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.PLATFORM_ADMIN_PASSWORD_RESET_SENT.name(), AuditResult.SUCCESS)
            .targetUser(admin.userId)
            .resource("PLATFORM_ADMIN", admin.id)
            .details(details)
            .client(actor.ipAddress, actor.userAgent));

        PlatformResponses.AdminMutation mutation = mutation(admin, true);
        return mutation;
    }

    @Transactional
    public PlatformResponses.AdminMutation disableTwoFactor(UUID adminId, String supportTicket, String reason,
                                                            String confirmPassword, PlatformActor actor) {
        guardService.verifyConfirmPassword(actor.userId, confirmPassword);
        if (supportTicket == null || supportTicket.isBlank()) {
            throw new ApiException(400, ErrorCode.VALIDATION_REQUIRED, "support_ticket is required",
                Map.of("field", "support_ticket"));
        }
        PlatformSuperAdmin admin = requireAdmin(adminId);
        UserTwoFactor twoFactor = UserTwoFactor.findByUserId(admin.userId);
        if (twoFactor != null) {
            twoFactor.delete();
        }

        ObjectNode details = objectMapper.createObjectNode();
        details.put("support_ticket", supportTicket);
        details.put("two_factor_disabled", true);
        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId,
                PlatformAction.PLATFORM_ADMIN_2FA_DISABLED.name(), AuditResult.SUCCESS)
            .targetUser(admin.userId)
            .resource("PLATFORM_ADMIN", admin.id)
            .details(details)
            .reason(reason)
            .client(actor.ipAddress, actor.userAgent));

        mailService.sendAdmin2FaDisabledAlert(resolveEmail(admin.userId), supportTicket);
        PlatformResponses.AdminMutation mutation = mutation(admin, false);
        mutation.twoFactorRequired = true;
        return mutation;
    }

    public PlatformSuperAdmin requireAdmin(UUID adminId) {
        PlatformSuperAdmin admin = superAdminRepository.find("id", adminId).firstResult();
        if (admin == null) {
            throw new ApiException(404, PlatformErrorCode.PLATFORM_ADMIN_NOT_FOUND, "Platform admin not found");
        }
        return admin;
    }

    private void assertNotLastActiveSuperAdmin(PlatformSuperAdmin admin) {
        if (admin.role != PlatformAdminRole.SUPER_ADMIN || admin.status != PlatformAdminStatus.ACTIVE) {
            return;
        }
        List<?> activeIds = entityManager.createNativeQuery(
                "SELECT id FROM platform_super_admins WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE' FOR UPDATE")
            .getResultList();
        if (activeIds.size() <= 1) {
            throw new ApiException(409, PlatformErrorCode.PLATFORM_LAST_ADMIN_PROTECTED,
                "The last active platform admin is protected");
        }
    }

    private void auditAdminChange(PlatformSuperAdmin admin, PlatformAction action, PlatformActor actor,
                                  String reason, String beforeStatus, String afterStatus) {
        ObjectNode details = objectMapper.createObjectNode();
        details.putObject("before").put("status", beforeStatus);
        details.putObject("after").put("status", afterStatus);
        auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, actor.actorType(), actor.userId, action.name(), AuditResult.SUCCESS)
            .targetUser(admin.userId)
            .resource("PLATFORM_ADMIN", admin.id)
            .details(details)
            .reason(reason)
            .client(actor.ipAddress, actor.userAgent));
    }

    private PlatformResponses.AdminMutation mutation(PlatformSuperAdmin admin, boolean resetTokenSent) {
        PlatformResponses.AdminMutation mutation = new PlatformResponses.AdminMutation();
        mutation.adminId = admin.id.toString();
        mutation.userId = admin.userId.toString();
        mutation.email = resolveEmail(admin.userId);
        mutation.role = admin.role != null ? admin.role.name() : null;
        mutation.status = admin.status != null ? admin.status.name() : null;
        mutation.mustChangePassword = admin.mustChangePassword;
        mutation.twoFactorRequired = admin.twoFactorRequired;
        mutation.disabledAt = admin.disabledAt;
        if (resetTokenSent) {
            mutation.resetTokenSent = true;
        }
        return mutation;
    }

    private PlatformResponses.AdminItem toItem(PlatformSuperAdmin admin, boolean twoFactorEnabled) {
        PlatformResponses.AdminItem item = new PlatformResponses.AdminItem();
        item.adminId = admin.id.toString();
        item.userId = admin.userId.toString();
        item.email = resolveEmail(admin.userId);
        item.fullName = resolveFullName(admin.userId);
        item.role = admin.role != null ? admin.role.name() : null;
        item.status = admin.status != null ? admin.status.name() : null;
        item.mustChangePassword = admin.mustChangePassword;
        item.twoFactorRequired = admin.twoFactorRequired;
        item.is2FaEnabled = twoFactorEnabled;
        item.lastLoginAt = admin.lastLoginAt;
        item.disabledAt = admin.disabledAt;
        item.createdAt = admin.createdAt;
        return item;
    }

    private Set<UUID> enabledTwoFactorUsers() {
        @SuppressWarnings("unchecked")
        List<Object> rows = entityManager.createNativeQuery(
                "SELECT user_id FROM user_two_factor WHERE is_enabled = TRUE")
            .getResultList();
        Set<UUID> ids = new HashSet<>();
        for (Object row : rows) {
            if (row != null) {
                ids.add(UUID.fromString(row.toString()));
            }
        }
        return ids;
    }

    private String resolveEmail(UUID userId) {
        List<?> rows = entityManager.createNativeQuery("SELECT email FROM users WHERE id = :id")
            .setParameter("id", userId).getResultList();
        return rows.isEmpty() || rows.get(0) == null ? null : rows.get(0).toString();
    }

    private String resolveFullName(UUID userId) {
        List<?> rows = entityManager.createNativeQuery("SELECT full_name FROM user_profiles WHERE user_id = :id")
            .setParameter("id", userId).getResultList();
        return rows.isEmpty() || rows.get(0) == null ? null : rows.get(0).toString();
    }

    private void issueResetToken(User user) {
        if (user == null) {
            return;
        }
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

    private String generateTemporaryPassword() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes) + "aA1!";
    }
}
