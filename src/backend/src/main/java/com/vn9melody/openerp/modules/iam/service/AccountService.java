package com.vn9melody.openerp.modules.iam.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.*;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.iam.dto.ChangePasswordRequest;
import com.vn9melody.openerp.modules.iam.dto.ProfileUpdateRequest;
import com.vn9melody.openerp.modules.iam.dto.response.UserProfileResponse;
import com.vn9melody.openerp.modules.iam.dto.response.UserSessionResponse;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.iam.model.UserCredential;
import com.vn9melody.openerp.modules.iam.model.UserProfile;

@ApplicationScoped
public class AccountService {

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    SessionManager sessionManager;

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

        if (Boolean.TRUE.equals(req.logoutOtherDevices) && currentSessionId != null) {
            sessionManager.revokeOtherSessions(userId, currentSessionId);
        }
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
