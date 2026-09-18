package com.vn9melody.openerp.modules.iam.resource;

import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.modules.iam.dto.*;
import com.vn9melody.openerp.modules.iam.dto.response.*;
import com.vn9melody.openerp.modules.iam.service.AuthService;
import com.vn9melody.openerp.modules.iam.service.TwoFactorService;

@Path("/api/v1/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @Inject
    TwoFactorService twoFactorService;

    @Inject
    JWTParser jwtParser;

    @POST
    @Path("/register/personal")
    public Response registerPersonal(@Valid PersonalRegisterRequest req) {
        PersonalRegisterResponse data = authService.registerPersonal(req);
        return Response.status(Response.Status.CREATED).entity(
            ApiResponse.success(ErrorCode.AUTH_REGISTER_SUCCESS, "Registration successful. Please verify your email.", data)
        ).build();
    }

    @POST
    @Path("/verify-email")
    public Response verifyEmail(@Valid VerifyEmailRequest req) {
        VerifyEmailResponse data = authService.verifyEmail(req);
        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_EMAIL_VERIFIED_SUCCESS, "Email verified successfully.", data)
        ).build();
    }

    @POST
    @Path("/register/business")
    public Response registerBusiness(@Valid BusinessRegisterRequest req) {
        BusinessRegisterResponse data = authService.registerBusiness(req);
        return Response.status(Response.Status.CREATED).entity(
            ApiResponse.success(ErrorCode.AUTH_BUSINESS_REGISTER_SUCCESS, "Business organization initialized successfully.", data)
        ).build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest req, @Context HttpHeaders headers) {
        String device = extractDevice(headers);
        String ipAddress = "127.0.0.1";
        AuthResponse data = authService.login(req, device, ipAddress);

        if (Boolean.TRUE.equals(data.requires2Fa)) {
            return Response.ok(
                ApiResponse.success(ErrorCode.AUTH_2FA_REQUIRED, "Two-factor authentication code required.", data)
            ).build();
        }

        if (Boolean.TRUE.equals(data.requiresTenantSelection)) {
            return Response.ok(
                ApiResponse.success(ErrorCode.AUTH_SELECT_TENANT_REQUIRED, "Select workspace tenant to proceed.", data)
            ).build();
        }

        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_LOGIN_SUCCESS, "Authenticated successfully.", data)
        ).build();
    }

    @POST
    @Path("/select-tenant")
    public Response selectTenant(@Valid SelectTenantRequest req, @Context HttpHeaders headers) {
        UUID userId = parseUserIdFromPreAuthToken(req.preAuthToken);
        String device = extractDevice(headers);
        String ipAddress = "127.0.0.1";

        AuthResponse data = authService.selectTenant(userId, req.tenantId, device, ipAddress);
        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_LOGIN_SUCCESS, "Authenticated successfully.", data)
        ).build();
    }

    @POST
    @Path("/2fa/verify-login")
    public Response verifyLogin2Fa(@Valid VerifyLogin2FaRequest req, @Context HttpHeaders headers) {
        UUID userId = parseUserIdFromPreAuthToken(req.preAuthToken);
        String device = extractDevice(headers);
        String ipAddress = "127.0.0.1";

        AuthResponse data = twoFactorService.verifyLogin2Fa(userId, req.code, device, ipAddress);
        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_LOGIN_SUCCESS, "Authenticated successfully.", data)
        ).build();
    }

    @POST
    @Path("/forgot-password")
    public Response forgotPassword(@Valid ForgotPasswordRequest req) {
        authService.forgotPassword(req.email);
        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_FORGOT_PASSWORD_REQUESTED, "If the account exists, reset instructions have been sent.", null)
        ).build();
    }

    @POST
    @Path("/reset-password")
    public Response resetPassword(@Valid ResetPasswordRequest req) {
        authService.resetPassword(req.token, req.newPassword);
        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_PASSWORD_RESET_SUCCESS, "Password reset successfully. Please log in again.", null)
        ).build();
    }

    private UUID parseUserIdFromPreAuthToken(String token) {
        try {
            JsonWebToken jwt = jwtParser.parse(token);
            String sub = jwt.getSubject();
            return UUID.fromString(sub);
        } catch (ParseException | IllegalArgumentException e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid or expired pre-auth token");
        }
    }

    private String extractDevice(HttpHeaders headers) {
        if (headers == null) return "Web Browser";
        String ua = headers.getHeaderString("User-Agent");
        return (ua != null && !ua.isBlank()) ? ua : "Web Browser";
    }
}
