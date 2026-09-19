package com.vn9melody.openerp.modules.iam.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.*;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.audit.AuditTrail;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.dto.ChangePasswordRequest;
import com.vn9melody.openerp.modules.iam.dto.ProfileUpdateRequest;
import com.vn9melody.openerp.modules.iam.dto.response.UserProfileResponse;
import com.vn9melody.openerp.modules.iam.dto.response.UserSessionResponse;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.core.service.TenantQuotaService;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;

@ApplicationScoped
public class AccountService {

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    SessionManager sessionManager;

    @Inject
    TenantQuotaService tenantQuotaService;

    @Inject
    PlatformSuperAdminRepository platformSuperAdminRepository;

    @Inject
    AuditTrail auditTrail;

    /**
     * Quota enforcement hook (TASK-269 / BUG-53). Every tenant user-provisioning
     * flow must call this single entry point before persisting a new membership;
     * it fails fast with {@code 409 PLATFORM_TENANT_QUOTA_EXCEEDED} when the
     * tenant reached {@code max_users}. Existing behavior is intentionally
     * unchanged (registration flows live in AuthService).
     */
    public void enforceUserQuota(UUID tenantId) {
        // TASK-269: one shared quota check call-site for account/member creation.
        tenantQuotaService.checkUserQuota(tenantId);
    }

    public UserProfileResponse getProfile(UUID userId) {
        User user = User.findById(userId);
        if (user == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "User not found");
        }
        UserProfile profile = UserProfile.findByUserId(userId);

        return new UserProfileResponse(
            user.id.toString(),
            user.email,
            profile != null ? profile.fullName : "",
            profile != null ? profile.phone : null,
            profile != null ? profile.avatarUrl : null,
            profile != null ? profile.language : "vi",
            profile != null ? profile.timezone : "Asia/Ho_Chi_Minh"
        );
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, ProfileUpdateRequest req) {
        UserProfile profile = UserProfile.findByUserId(userId);
        if (profile == null) {
            User user = User.findById(userId);
            if (user == null) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "User not found");
            }
            profile = new UserProfile();
            profile.user = user;
            profile.userId = user.id;
        }

        profile.fullName = req.fullName.trim();
        if (req.phone != null) profile.phone = req.phone.trim();
        if (req.avatarUrl != null) profile.avatarUrl = req.avatarUrl.trim();
        if (req.language != null) profile.language = req.language.trim();
        if (req.timezone != null) profile.timezone = req.timezone.trim();
        profile.updatedAt = Instant.now();
        profile.persist();

        return getProfile(userId);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest req, String currentSessionId) {
        UserCredential credential = UserCredential.findByUserId(userId);
        if (credential == null || !passwordHashService.checkPassword(req.currentPassword, credential.passwordHash)) {
            throw new ApiException(400, ErrorCode.ACCOUNT_OLD_PASSWORD_INCORRECT, "Current password is incorrect");
        }

        credential.passwordHash = passwordHashService.hashPassword(req.newPassword);
        credential.passwordUpdatedAt = Instant.now();
        credential.persist();

        boolean forcedPlatformChangeReleased = releasePlatformAdminPasswordChange(userId);

        if (forcedPlatformChangeReleased) {
            // BUG-76: the old access token still carries must_change_password=true;
            // revoke every session so it can never reach the portal again. The admin
            // logs in again and receives a fresh token bound to the new state.
            sessionManager.revokeAllSessions(userId);
        } else if (Boolean.TRUE.equals(req.logoutOtherDevices) && currentSessionId != null) {
            sessionManager.revokeOtherSessions(userId, currentSessionId);
        }
    }

    /**
     * TASK-294 / BUG-77: after a successful self-service password change, a platform
     * admin must be released from the forced password change confinement, otherwise
     * {@code PlatformRoleRequiredFilter} keeps rejecting every platform endpoint with
     * {@code PLATFORM_PASSWORD_CHANGE_REQUIRED} forever. INVITED admins are activated
     * as part of the same confirmation step (SOL-01 1.2.2).
     */
    private boolean releasePlatformAdminPasswordChange(UUID userId) {
        PlatformSuperAdmin admin = platformSuperAdminRepository.findByUserId(userId);
        if (admin == null
                || (admin.status != PlatformAdminStatus.INVITED && admin.status != PlatformAdminStatus.ACTIVE)) {
            return false;
        }
        boolean updated = false;
        if (admin.status == PlatformAdminStatus.INVITED) {
            admin.status = PlatformAdminStatus.ACTIVE;
            updated = true;
        }
        if (Boolean.TRUE.equals(admin.mustChangePassword)) {
            admin.mustChangePassword = false;
            updated = true;
        }
        if (!updated) {
            return false;
        }
        admin.updatedAt = Instant.now();
        admin.persist();
        auditTrail.recordSuccess(null, PlatformAction.PLATFORM_ADMIN_PASSWORD_CHANGED, "PLATFORM_ADMIN", admin.id,
            Map.of(ResponseKey.USER_ID.getKey(), admin.userId.toString()));
        return true;
    }

    public List<UserSessionResponse> getSessions(UUID userId, String currentSessionId) {
        List<SessionManager.SessionInfo> sessions = sessionManager.getUserSessions(userId);
        List<UserSessionResponse> result = new ArrayList<>();
        for (SessionManager.SessionInfo s : sessions) {
            result.add(new UserSessionResponse(
                s.getSessionId(),
                s.getDevice(),
                s.getIpAddress(),
                s.getLastActiveAt().toString(),
                s.getCreatedAt().toString(),
                s.getSessionId().equals(currentSessionId)
            ));
        }
        return result;
    }

    public void revokeSession(UUID userId, String sessionId) {
        boolean revoked = sessionManager.revokeSession(userId, sessionId);
        if (!revoked) {
            throw new ApiException(404, ErrorCode.ACCOUNT_SESSION_NOT_FOUND, "Session not found");
        }
    }

    public void revokeOtherSessions(UUID userId, String currentSessionId) {
        if (currentSessionId != null) {
            sessionManager.revokeOtherSessions(userId, currentSessionId);
        }
    }
}
