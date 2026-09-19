package com.vn9melody.openerp.modules.iam.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.AccessTokenVerifier;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.core.security.SessionManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Resolves the authenticated tenant principal for every {@code /api/v1/iam/*} call.
 *
 * <p>TODO(wave-integration): switch to the shared {@code UserSecurityContext} filter and attach
 * {@code @RequirePermission("core:role:manage" | "core:permission:read" | ...)} annotations.</p>
 */
@ApplicationScoped
public class IamSecurityResolver {

    @Inject
    AccessTokenVerifier accessTokenVerifier;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    SessionManager sessionManager;

    public record IamPrincipal(UUID userId, UUID tenantId, String role, String sessionId) {
    }

    public IamPrincipal requireTenantPrincipal(String authorizationHeader) {
        AccessTokenVerifier.VerifiedAccessToken token = accessTokenVerifier.verifyBearer(authorizationHeader);

        String sessionId = token.sessionId();
        if (sessionId == null || sessionId.isBlank()
                || !sessionManager.isSessionActive(token.userId(), sessionId)) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Session is no longer active");
        }

        UUID tenantId = extractTenantId(authorizationHeader);
        if (tenantId == null) {
            throw new ApiException(403, ErrorCode.FORBIDDEN, "Tenant context is required for this operation");
        }
        return new IamPrincipal(token.userId(), tenantId, token.role(), sessionId);
    }

    private UUID extractTenantId(String authorizationHeader) {
        if (authorizationHeader == null) {
            return null;
        }
        try {
            JsonWebToken jwt = jwtTokenService.parseToken(authorizationHeader.substring(7).trim());
            String tenantId = jwt.getClaim("tenant_id");
            if (tenantId == null || tenantId.isBlank()) {
                return null;
            }
            return UUID.fromString(tenantId);
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid or expired access token");
        }
    }
}
