package com.vn9melody.openerp.modules.iam.resource;

import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.ResponseKey;
import com.vn9melody.openerp.core.security.AccessTokenVerifier;
import com.vn9melody.openerp.core.security.PreAuthSessionService;
import com.vn9melody.openerp.modules.iam.dto.*;
import com.vn9melody.openerp.modules.iam.dto.response.*;
import com.vn9melody.openerp.modules.iam.service.AuthService;
import com.vn9melody.openerp.modules.iam.service.TwoFactorService;

@Path("/api/v1/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    private static final String PURPOSE_2FA_CHALLENGE = "2FA_CHALLENGE";
    private static final String PURPOSE_SELECT_TENANT = "SELECT_TENANT";
    private static final long ACCESS_TOKEN_TTL_SECONDS = 900;

    @Inject
    AuthService authService;

    @Inject
    TwoFactorService twoFactorService;

    @Inject
    JWTParser jwtParser;

    @Inject
    AccessTokenVerifier accessTokenVerifier;

    @Inject
    PreAuthSessionService preAuthSessionService;

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
    @Path("/resend-verification")
    public Response resendVerification(@Valid ResendVerificationRequest req) {
        authService.resendVerification(req.email);
        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_VERIFICATION_EMAIL_RESENT, "If the email exists, a new verification code has been sent.", null)
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

    @GET
    @Path("/check-slug")
    public Response checkTenantSlug(@QueryParam("slug") String slug) {
        String normalizedSlug = authService.normalizeTenantSlug(slug);
        if (!authService.isTenantSlugValid(normalizedSlug)) {
            Map<String, Object> params = new HashMap<>();
            params.put(ResponseKey.FIELD.getKey(), "slug");
            throw new ApiException(400, ErrorCode.VALIDATION_FAILED, "Tenant slug is invalid", params);
        }

        boolean available = authService.isTenantSlugAvailable(normalizedSlug);
        String code = available ? ErrorCode.AUTH_TENANT_SLUG_AVAILABLE : ErrorCode.AUTH_TENANT_SLUG_DUPLICATE;
        String message = available ? "Tenant slug is available." : "Tenant slug is already taken.";
        SlugCheckResponse data = new SlugCheckResponse(normalizedSlug, available);
        return Response.ok(ApiResponse.success(code, message, data)).build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest req, @Context HttpHeaders headers, @Context HttpServerRequest request) {
        String device = extractDevice(headers);
        String ipAddress = extractClientIp(request);
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
    public Response selectTenant(@Valid SelectTenantRequest req, @Context HttpHeaders headers, @Context HttpServerRequest request) {
        JsonWebToken preAuthJwt = parsePreAuthToken(req.preAuthToken, PURPOSE_SELECT_TENANT);
        UUID userId = extractUserId(preAuthJwt);
        String device = extractDevice(headers);
        String ipAddress = extractClientIp(request);

        AuthResponse data = authService.selectTenant(userId, req.tenantId, device, ipAddress, preAuthJwt.getTokenID());
        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_LOGIN_SUCCESS, "Authenticated successfully.", data)
        ).build();
    }

    @POST
    @Path("/2fa/verify-login")
    public Response verifyLogin2Fa(@Valid VerifyLogin2FaRequest req, @Context HttpHeaders headers, @Context HttpServerRequest request) {
        JsonWebToken preAuthJwt = parsePreAuthToken(req.preAuthToken, PURPOSE_2FA_CHALLENGE);
        UUID userId = extractUserId(preAuthJwt);
        String device = extractDevice(headers);
        String ipAddress = extractClientIp(request);

        AuthResponse data = twoFactorService.verifyLogin2Fa(userId, preAuthJwt.getTokenID(), req.code, device, ipAddress);

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

    @POST
    @Path("/refresh")
    public Response refresh(@Valid RefreshTokenRequest req) {
        RefreshTokenResponse data = authService.refresh(req.refreshToken);
        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_TOKEN_REFRESH_SUCCESS, "Access token refreshed successfully.", data)
        ).build();
    }

    @POST
    @Path("/logout")
    public Response logout(@Context HttpHeaders headers) {
        String authorization = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
        AccessTokenVerifier.VerifiedAccessToken token = accessTokenVerifier.verifyBearer(authorization);
        authService.logout(token.userId(), token.sessionId(), token.jti(), ACCESS_TOKEN_TTL_SECONDS);

        return Response.ok(
            ApiResponse.success(ErrorCode.AUTH_LOGOUT_SUCCESS, "Logged out successfully.", null)
        ).build();
    }

    private JsonWebToken parsePreAuthToken(String token, String expectedPurpose) {
        try {
            JsonWebToken jwt = jwtParser.parse(token);
            String type = jwt.getClaim("type");
            String purpose = jwt.getClaim("purpose");
            String jti = jwt.getTokenID();

            if (!"PRE_AUTH".equals(type) || !expectedPurpose.equals(purpose) || jti == null) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid or expired pre-auth token");
            }

            if (!expectedPurpose.equals(preAuthSessionService.getPurpose(jti))) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Pre-auth session is invalid or expired");
            }
            return jwt;
        } catch (ApiException e) {
            throw e;
        } catch (ParseException | IllegalArgumentException e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid or expired pre-auth token");
        }
    }

    private UUID extractUserId(JsonWebToken jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid user identifier in token");
        }
    }

    private String extractClientIp(HttpServerRequest request) {
        if (request == null) {
            return "unknown";
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String first = forwardedFor.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        if (request.remoteAddress() != null && request.remoteAddress().host() != null) {
            return request.remoteAddress().host();
        }
        return "unknown";
    }

    private String extractDevice(HttpHeaders headers) {
        if (headers == null) return "Web Browser";
        String ua = headers.getHeaderString("User-Agent");
        return (ua != null && !ua.isBlank()) ? ua : "Web Browser";
    }
}
