package com.vn9melody.openerp.modules.platform.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.dto.response.AuthResponse;
import com.vn9melody.openerp.modules.iam.dto.response.AuthUserInfo;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserProfile;
import com.vn9melody.openerp.modules.platform.model.PlatformSuperAdmin;
import com.vn9melody.openerp.modules.platform.repository.PlatformSuperAdminRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import org.jboss.logging.Logger;

/**
 * Platform login path (BUG-65 / TASK-274). Invoked by the shared
 * {@code /api/v1/auth/login} endpoint after the password has been validated:
 * if the account is a platform admin it receives a platform-scoped JWT
 * (claim {@code platform_role} + {@code groups}) and never enters the tenant
 * resolution flow.
 */
@ApplicationScoped
public class PlatformLoginService {

    private static final Logger LOG = Logger.getLogger(PlatformLoginService.class);

    @Inject
    PlatformSuperAdminRepository superAdminRepository;

    @Inject
    PlatformJwtService platformJwtService;

    @Inject
    SessionManager sessionManager;

    /**
     * @return the platform auth response when {@code user} is a platform admin,
     *         or {@code null} when the regular tenant login flow must continue.
     */
    public AuthResponse tryLogin(User user, String device, String ipAddress) {
        PlatformSuperAdmin admin = superAdminRepository.findByUserId(user.id);
        if (admin == null) {
            return null;
        }
        if (admin.status == PlatformAdminStatus.DISABLED || admin.status == PlatformAdminStatus.REVOKED) {
            LOG.warnf("Platform login refused for %s: admin status %s", user.email, admin.status);
            throw new ApiException(401, ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid email or password");
        }

        if (admin.status == PlatformAdminStatus.INVITED) {
            admin.status = PlatformAdminStatus.ACTIVE;
            admin.isActive = true;
        }
        admin.lastLoginAt = Instant.now();
        admin.persist();

        String sessionId = sessionManager.createSession(user.id, device, ipAddress);
        String accessToken = platformJwtService.generatePlatformAccessToken(
            user.id, user.email, admin.role, Boolean.TRUE.equals(admin.mustChangePassword), sessionId);

        UserProfile profile = UserProfile.findByUserId(user.id);
        AuthUserInfo userInfo = new AuthUserInfo(
            user.id.toString(),
            user.email,
            profile != null ? profile.fullName : "",
            null,
            null,
            null,
            admin.role.name()
        );

        return AuthResponse.forSuccess(
            accessToken, null, sessionId, (int) PlatformJwtService.PLATFORM_ACCESS_TTL_SECONDS, userInfo);
    }
}
