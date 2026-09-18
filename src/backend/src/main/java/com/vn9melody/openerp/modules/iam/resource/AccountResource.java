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
import org.eclipse.microprofile.jwt.JsonWebToken;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
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
public class AccountResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    AccountService accountService;

    @Inject
    TwoFactorService twoFactorService;

    @GET
    @Path("/profile")
    public Response getProfile() {
        UUID userId = getAuthenticatedUserId();
        UserProfileResponse data = accountService.getProfile(userId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_PROFILE_FETCH_SUCCESS, "Profile fetched successfully.", data)
        ).build();
    }

    @PUT
    @Path("/profile")
    public Response updateProfile(@Valid ProfileUpdateRequest req) {
        UUID userId = getAuthenticatedUserId();
        UserProfileResponse data = accountService.updateProfile(userId, req);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_PROFILE_UPDATE_SUCCESS, "Profile updated successfully.", data)
        ).build();
    }

    @POST
    @Path("/change-password")
    public Response changePassword(@Valid ChangePasswordRequest req, @Context HttpHeaders headers) {
        UUID userId = getAuthenticatedUserId();
        String currentSessionId = headers.getHeaderString("X-Session-Id");
        accountService.changePassword(userId, req, currentSessionId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_PASSWORD_CHANGE_SUCCESS, "Password changed successfully.", null)
        ).build();
    }

    @GET
    @Path("/2fa/status")
    public Response get2FaStatus() {
        UUID userId = getAuthenticatedUserId();
        TwoFactorStatusResponse data = twoFactorService.getStatus(userId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_STATUS_FETCH_SUCCESS, "Two-factor authentication status retrieved.", data)
        ).build();
    }

    @POST
    @Path("/2fa/setup")
    public Response setup2Fa() {
        UUID userId = getAuthenticatedUserId();
        TwoFactorSetupResponse data = twoFactorService.setup2Fa(userId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_SETUP_SUCCESS, "2FA setup initiated successfully. Please verify with OTP to complete.", data)
        ).build();
    }

    @POST
    @Path("/2fa/enable")
    public Response enable2Fa(@Valid Enable2FaRequest req) {
        UUID userId = getAuthenticatedUserId();
        TwoFactorEnableResponse data = twoFactorService.enable2Fa(userId, req.code);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_ENABLED_SUCCESS, "Two-factor authentication enabled successfully.", data)
        ).build();
    }

    @POST
    @Path("/2fa/disable")
    public Response disable2Fa(@Valid Disable2FaRequest req) {
        UUID userId = getAuthenticatedUserId();
        twoFactorService.disable2Fa(userId, req.currentPassword, req.code);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_DISABLED_SUCCESS, "Two-factor authentication disabled successfully.", null)
        ).build();
    }

    @POST
    @Path("/2fa/regenerate-backup-codes")
    public Response regenerateBackupCodes(@Valid RegenerateBackupCodesRequest req) {
        UUID userId = getAuthenticatedUserId();
        BackupCodesResponse data = twoFactorService.regenerateBackupCodes(userId, req.currentPassword);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_2FA_BACKUP_CODES_REGENERATED, "Backup codes regenerated successfully.", data)
        ).build();
    }

    @GET
    @Path("/sessions")
    public Response getSessions(@Context HttpHeaders headers) {
        UUID userId = getAuthenticatedUserId();
        String currentSessionId = headers.getHeaderString("X-Session-Id");
        List<UserSessionResponse> sessions = accountService.getSessions(userId, currentSessionId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_SESSIONS_FETCH_SUCCESS, "Active sessions retrieved successfully.", sessions)
        ).build();
    }

    @DELETE
    @Path("/sessions/{sessionId}")
    public Response revokeSession(@PathParam("sessionId") String sessionId) {
        UUID userId = getAuthenticatedUserId();
        accountService.revokeSession(userId, sessionId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_SESSION_REVOKED_SUCCESS, "Device session revoked successfully.", null)
        ).build();
    }

    @DELETE
    @Path("/sessions/other")
    public Response revokeOtherSessions(@Context HttpHeaders headers) {
        UUID userId = getAuthenticatedUserId();
        String currentSessionId = headers.getHeaderString("X-Session-Id");
        accountService.revokeOtherSessions(userId, currentSessionId);
        return Response.ok(
            ApiResponse.success(ErrorCode.ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS, "All other sessions revoked successfully.", null)
        ).build();
    }

    private UUID getAuthenticatedUserId() {
        if (jwt == null || jwt.getSubject() == null) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Unauthorized access: valid token required");
        }
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid user identifier in token");
        }
    }
}
