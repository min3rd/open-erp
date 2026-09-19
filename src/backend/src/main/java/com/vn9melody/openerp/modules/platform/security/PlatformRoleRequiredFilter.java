package com.vn9melody.openerp.modules.platform.security;

import com.vn9melody.openerp.core.api.ApiErrorResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.security.SessionManager;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.api.PlatformSupport;
import com.vn9melody.openerp.modules.platform.service.PlatformJwtService;
import io.smallrye.common.annotation.Blocking;
import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.Provider;
import java.time.Instant;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

/**
 * Server-side guard for every {@code /api/v1/platform/**} endpoint (BUG-65).
 * Only tokens issued by the platform login path (claim {@code platform_role} +
 * {@code scope = PLATFORM} + active Redis session) are accepted; tenant tokens are
 * rejected with {@code 403 PLATFORM_ACCESS_DENIED}.
 *
 * <p>The impersonation exit endpoint is the only exception: it is validated by
 * {@code ImpersonationService} against the Redis impersonation session key.</p>
 */
@Provider
@Blocking
@Priority(Priorities.AUTHENTICATION)
@ApplicationScoped
public class PlatformRoleRequiredFilter implements ContainerRequestFilter {

    private static final Logger LOG = Logger.getLogger(PlatformRoleRequiredFilter.class);

    private static final String PREFIX = "api/v1/platform";
    private static final String IMPERSONATION_EXIT = PREFIX + "/impersonate/exit";
    private static final String IMPERSONATION_EXIT_ALIAS = PREFIX + "/impersonation/exit";

    @Inject
    JWTParser jwtParser;

    @Inject
    SessionManager sessionManager;

    @Inject
    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String expectedIssuer;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        UriInfo uriInfo = requestContext.getUriInfo();
        String path = uriInfo.getPath();
        if (path == null) {
            return;
        }
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        if (!path.startsWith(PREFIX)) {
            return;
        }
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            return;
        }
        // Impersonation exit is guarded by the impersonation session (BUG-65 / SOL-01 2.1).
        if (IMPERSONATION_EXIT.equals(path) || IMPERSONATION_EXIT_ALIAS.equals(path)) {
            return;
        }

        String authorization = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                || authorization.substring(7).trim().isEmpty()) {
            abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "Unauthorized access: platform token required");
            return;
        }

        JsonWebToken jwt;
        try {
            jwt = jwtParser.parse(authorization.substring(7).trim());
            String type = PlatformSupport.claim(jwt, "type");
            if (type != null && !type.isBlank()) {
                abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "Invalid or expired platform access token");
                return;
            }
            if (expectedIssuer != null && !expectedIssuer.isBlank() && !expectedIssuer.equals(jwt.getIssuer())) {
                abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "Invalid or expired platform access token");
                return;
            }
            long exp = jwt.getExpirationTime();
            if (exp > 0 && exp <= Instant.now().getEpochSecond()) {
                abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "Invalid or expired platform access token");
                return;
            }
        } catch (Exception e) {
            abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "Invalid or expired platform access token");
            return;
        }

        String platformRole = PlatformSupport.claim(jwt, PlatformJwtService.CLAIM_PLATFORM_ROLE);
        String scope = PlatformSupport.claim(jwt, PlatformJwtService.CLAIM_SCOPE);
        boolean isImpersonation = PlatformSupport.booleanClaim(jwt, PlatformJwtService.CLAIM_IS_IMPERSONATION);

        if (platformRole == null || platformRole.isBlank()
                || !PlatformJwtService.SCOPE_PLATFORM.equals(scope)
                || isImpersonation) {
            LOG.warnf("Tenant/non-platform token attempted to access %s", path);
            abort(requestContext, 403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                "You do not have access to the platform administration portal");
            return;
        }

        PlatformAdminRole role = PlatformAdminRole.fromString(platformRole);

        UUID userId;
        try {
            userId = UUID.fromString(jwt.getSubject());
        } catch (Exception e) {
            abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "Invalid platform token subject");
            return;
        }

        String sessionId = PlatformSupport.claim(jwt, "session_id");
        if (sessionId == null || !sessionManager.isSessionActive(userId, sessionId)) {
            abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "Platform session is no longer active");
            return;
        }

        if (role == PlatformAdminRole.SUPPORT_ENGINEER && isForbiddenForSupportEngineer(requestContext, path)) {
            String code = path.endsWith("/impersonate")
                ? PlatformErrorCode.PLATFORM_IMPERSONATION_FORBIDDEN
                : PlatformErrorCode.PLATFORM_ACCESS_DENIED;
            abort(requestContext, 403, code, "Support engineers are not allowed to perform this action");
            return;
        }

        requestContext.setProperty(PlatformSupport.JWT_CONTEXT_PROPERTY, jwt);
    }

    private boolean isForbiddenForSupportEngineer(ContainerRequestContext ctx, String path) {
        String method = ctx.getMethod();
        if (path.startsWith(PREFIX + "/admins")) {
            return true;
        }
        if (!"GET".equalsIgnoreCase(method)) {
            return true;
        }
        return false;
    }

    private void abort(ContainerRequestContext ctx, int status, String code, String message) {
        ctx.abortWith(Response.status(status).entity(new ApiErrorResponse(code, message)).build());
    }
}
