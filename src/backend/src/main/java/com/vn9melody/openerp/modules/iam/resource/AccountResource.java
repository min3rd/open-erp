package com.vn9melody.openerp.modules.iam.resource;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;
import com.vn9melody.openerp.core.security.BlockDuringImpersonation;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.AccessTokenVerifier;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.core.security.TokenBlacklistService;
import com.vn9melody.openerp.modules.iam.dto.ChangePasswordRequest;
import com.vn9melody.openerp.modules.iam.dto.Disable2FaRequest;
import com.vn9melody.openerp.modules.iam.dto.Enable2FaRequest;
import com.vn9melody.openerp.modules.iam.dto.ProfileUpdateRequest;
import com.vn9melody.openerp.modules.iam.dto.RegenerateBackupCodesRequest;
import com.vn9melody.openerp.modules.iam.dto.response.*;
import com.vn9melody.openerp.modules.iam.service.AccountService;
import com.vn9melody.openerp.modules.iam.service.TwoFactorService;

@Path("/api/v1/account")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
// Self-service surface: the caller only ever acts on their own account, so no
// core:user:* functional permission is required (TASK-267 decision). Secret-bearing
// operations are blocked for impersonation sessions (BUG-68 / BR-SA-04).
public class AccountResource {

    @Inject
    AccessTokenVerifier accessTokenVerifier;

    @Inject
    AccountService accountService;

    @Inject
    TwoFactorService twoFactorService;

    @Inject
    SessionManager sessionManager;

    @Inject
    TokenBlacklistService tokenBlacklistService;

    @Context
    HttpHeaders httpHeaders;

    @GET
    @Path("/profile")
    public Response getProfile() {
        UUID userId = authenticate().userId();
        UserProfileResponse data = accountService.getProfile(userId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_PROFILE_FETCH_SUCCESS, "Profile fetched successfully.", data)
        ).build();
    }

    @PUT
    @Path("/profile")
    public Response updateProfile(@Valid ProfileUpdateRequest req) {
        UUID userId = authenticate().userId();
        UserProfileResponse data = accountService.updateProfile(userId, req);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_PROFILE_UPDATE_SUCCESS, "Profile updated successfully.", data)
        ).build();
    }

    @POST
    @Path("/change-password")
    @BlockDuringImpersonation
    public Response changePassword(@Valid ChangePasswordRequest req) {
        AccessTokenVerifier.VerifiedAccessToken token = authenticate();
        accountService.changePassword(token.userId(), req, resolveCurrentSessionId(token));
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_PASSWORD_CHANGE_SUCCESS, "Password changed successfully.", null)
        ).build();
    }

    @GET
    @Path("/2fa/status")
    public Response get2FaStatus() {
        UUID userId = authenticate().userId();
        TwoFactorStatusResponse data = twoFactorService.getStatus(userId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_STATUS_FETCH_SUCCESS, "Two-factor authentication status retrieved.", data)
        ).build();
    }

    @POST
    @Path("/2fa/setup")
    @BlockDuringImpersonation
    public Response setup2Fa() {
        UUID userId = authenticate().userId();
        TwoFactorSetupResponse data = twoFactorService.setup2Fa(userId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_SETUP_SUCCESS, "2FA setup initiated successfully. Please verify with OTP to complete.", data)
        ).build();
    }

    @POST
    @Path("/2fa/enable")
    @BlockDuringImpersonation
    public Response enable2Fa(@Valid Enable2FaRequest req) {
        UUID userId = authenticate().userId();
        TwoFactorEnableResponse data = twoFactorService.enable2Fa(userId, req.code);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_ENABLED_SUCCESS, "Two-factor authentication enabled successfully.", data)
        ).build();
    }

    @POST
    @Path("/2fa/disable")
    @BlockDuringImpersonation
    public Response disable2Fa(@Valid Disable2FaRequest req) {
        UUID userId = authenticate().userId();
        twoFactorService.disable2Fa(userId, req.currentPassword, req.code);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_DISABLED_SUCCESS, "Two-factor authentication disabled successfully.", null)
        ).build();
    }

    @POST
    @Path("/2fa/regenerate-backup-codes")
    @BlockDuringImpersonation
    public Response regenerateBackupCodes(@Valid RegenerateBackupCodesRequest req) {
        UUID userId = authenticate().userId();
        BackupCodesResponse data = twoFactorService.regenerateBackupCodes(userId, req.currentPassword);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_BACKUP_CODES_REGENERATED, "Backup codes regenerated successfully.", data)
        ).build();
    }

    @GET
    @Path("/sessions")
    public Response getSessions() {
        AccessTokenVerifier.VerifiedAccessToken token = authenticate();
        List<UserSessionResponse> sessions = accountService.getSessions(token.userId(), resolveCurrentSessionId(token));
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_SESSIONS_FETCH_SUCCESS, "Active sessions retrieved successfully.", SessionsResponse.of(sessions))
        ).build();
    }

    @DELETE
    @Path("/sessions/{sessionId}")
    public Response revokeSession(@PathParam("sessionId") String sessionId) {
        UUID userId = authenticate().userId();
        accountService.revokeSession(userId, sessionId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_SESSION_REVOKED_SUCCESS, "Device session revoked successfully.", null)
        ).build();
    }

    @DELETE
    @Path("/sessions/other")
    public Response revokeOtherSessions() {
        AccessTokenVerifier.VerifiedAccessToken token = authenticate();
        accountService.revokeOtherSessions(token.userId(), resolveCurrentSessionId(token));
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS, "All other sessions revoked successfully.", null)
        ).build();
    }

    private AccessTokenVerifier.VerifiedAccessToken authenticate() {
        String authorization = httpHeaders != null
            ? httpHeaders.getHeaderString(HttpHeaders.AUTHORIZATION)
            : null;
        AccessTokenVerifier.VerifiedAccessToken token = accessTokenVerifier.verifyBearer(authorization);

        if (token.jti() == null || tokenBlacklistService.isBlacklisted(token.jti())) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Token has been revoked");
        }

        String sessionId = resolveCurrentSessionId(token);
        if (sessionId == null || sessionId.isBlank() || !sessionManager.isSessionActive(token.userId(), sessionId)) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Session is no longer active");
        }

        return token;
    }

    private String resolveCurrentSessionId(AccessTokenVerifier.VerifiedAccessToken token) {
        String sessionId = token.sessionId();
        if (sessionId == null || sessionId.isBlank()) {
            sessionId = httpHeaders != null ? httpHeaders.getHeaderString("X-Session-Id") : null;
        }
        return sessionId;
    }
}
