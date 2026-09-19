package com.vn9melody.openerp.modules.platform.security;

import com.vn9melody.openerp.core.api.ApiErrorResponse;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.service.PlatformJwtService;
import io.smallrye.common.annotation.Blocking;
import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

/**
 * Blocks every tenant business API when the caller's tenant is SUSPENDED/EXPIRED/
 * PENDING_DELETION/DELETED or locked (BR-SA-05 / TASK-272, FEAT-10 AC3).
 *
 * <p>FEAT-10 scenario 3 requires "mọi API nghiệp vụ" to be rejected with
 * {@code TENANT_SUSPENDED}, which includes read-only GETs. Auth endpoints stay
 * reachable (login/logout) and the platform portal is guarded separately;
 * impersonation sessions are also blocked because the tenant state applies to
 * every caller.</p>
 */
@Provider
@Blocking
@Priority(Priorities.AUTHENTICATION + 10)
@ApplicationScoped
public class TenantStatusGuardFilter implements ContainerRequestFilter {

    private static final Logger LOG = Logger.getLogger(TenantStatusGuardFilter.class);
    private static final Set<String> BLOCKED_STATUSES =
        Set.of("SUSPENDED", "EXPIRED", "PENDING_DELETION", "DELETED");

    @Inject
    JWTParser jwtParser;

    @Inject
    EntityManager entityManager;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String method = requestContext.getMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return;
        }

        String path = requestContext.getUriInfo().getPath();
        if (path == null) {
            return;
        }
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        if (!path.startsWith("api/v1/")
                || path.startsWith("api/v1/auth/")
                || path.startsWith("api/v1/platform/")) {
            return;
        }

        String authorization = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return;
        }

        JsonWebToken jwt;
        try {
            jwt = jwtParser.parse(authorization.substring(7).trim());
        } catch (Exception e) {
            return;
        }

        // Platform-scoped tokens never carry a tenant; impersonation tokens do and must
        // be blocked together with every other caller of the suspended tenant.
        if (PlatformJwtService.SCOPE_PLATFORM.equals(claim(jwt, PlatformJwtService.CLAIM_SCOPE))) {
            return;
        }

        String tenantIdClaim = claim(jwt, "tenant_id");
        if (tenantIdClaim == null || tenantIdClaim.isBlank()) {
            return;
        }

        UUID tenantId;
        try {
            tenantId = UUID.fromString(tenantIdClaim);
        } catch (Exception e) {
            return;
        }

        String status = null;
        Boolean locked = null;
        try {
            Object[] row = entityManager.createQuery(
                    "select t.status, t.isLocked from Tenant t where t.id = :id", Object[].class)
                .setParameter("id", tenantId)
                .getResultStream()
                .findFirst()
                .orElse(null);
            if (row != null) {
                status = row[0] != null ? row[0].toString() : null;
                locked = (Boolean) row[1];
            }
        } catch (Exception e) {
            LOG.debugf("Tenant status guard could not resolve tenant %s: %s", tenantId, e.getMessage());
            return;
        }

        if (status == null) {
            return;
        }

        boolean blocked = BLOCKED_STATUSES.contains(status) || Boolean.TRUE.equals(locked);
        if (blocked) {
            LOG.infof("Rejected %s %s for tenant %s in status %s (locked=%s)",
                method, path, tenantId, status, locked);
            requestContext.abortWith(Response.status(403)
                .entity(new ApiErrorResponse(PlatformErrorCode.TENANT_SUSPENDED,
                    "Tenant is suspended or expired"))
                .build());
        }
    }

    private String claim(JsonWebToken jwt, String name) {
        try {
            return jwt.getClaim(name);
        } catch (Exception e) {
            return null;
        }
    }
}
