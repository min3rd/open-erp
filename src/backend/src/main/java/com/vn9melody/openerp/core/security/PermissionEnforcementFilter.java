package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.api.ApiErrorResponse;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.audit.AuditRecorder;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.ResponseKey;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import org.jboss.logging.Logger;

/**
 * Functional permission enforcement filter (SOL-02 section 6b, TASK-267).
 *
 * <p>Endpoints annotated with {@link RequirePermission} require the caller's
 * cached {@link UserSecurityContext} to contain the declared
 * {@code domain:resource:action} code; otherwise a standard
 * {@code 403 IAM_PERMISSION_DENIED_FUNCTIONAL} error envelope is returned and a
 * DENIED audit entry is queued. Endpoints without the annotation stay
 * default-allow so Sprint 01 APIs keep working unchanged.</p>
 *
 * <p>Endpoints annotated with {@link BlockDuringImpersonation} are additionally
 * rejected for impersonation tokens with
 * {@code 403 SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN} (BR-SA-04 / BUG-68).</p>
 */
@Provider
@ApplicationScoped
@Priority(Priorities.AUTHORIZATION)
public class PermissionEnforcementFilter implements ContainerRequestFilter {

    private static final Logger LOG = Logger.getLogger(PermissionEnforcementFilter.class);

    @Inject
    ResourceInfo resourceInfo;

    @Inject
    SecurityContextService securityContextService;

    @Inject
    Instance<AuditRecorder> auditRecorders;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            return;
        }

        SecurityContextService.TokenClaims claims = securityContextService.currentClaims();

        if (isBlockedDuringImpersonation(claims)) {
            recordDenied(claims.tenantId(), claims.userId(), "SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN",
                "IMPERSONATION_GUARD",
                Map.of(ResponseKey.RESOURCE.getKey(), requestContext.getUriInfo().getPath()));
            abort(requestContext, 403, ErrorCode.SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN,
                "Secret export is forbidden in impersonation mode", Map.of());
            return;
        }

        RequirePermission required = resolveAnnotation(RequirePermission.class);
        if (required == null || required.value().isBlank()) {
            return;
        }

        if (claims.platformToken()) {
            // Platform tokens bypass tenant functional/data checks; log it explicitly (TASK-267).
            LOG.infof("Platform token bypassed @RequirePermission(%s) for %s %s",
                required.value(), requestContext.getMethod(), requestContext.getUriInfo().getPath());
            return;
        }
        if (claims.userId() == null || claims.tenantId() == null) {
            abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "Unauthorized access: valid token required",
                Map.of());
            return;
        }

        UserSecurityContext context;
        try {
            context = securityContextService.getContext(claims.tenantId(), claims.userId());
        } catch (ApiException e) {
            abort(requestContext, e.getStatusCode(), e.getErrorCode(), e.getMessage(), e.getParams());
            return;
        }

        if (!context.hasPermission(required.value())) {
            Map<String, Object> params = new HashMap<>();
            params.put(ResponseKey.PERMISSION.getKey(), required.value());
            params.put(ResponseKey.REQUIRED_PERMISSION.getKey(), required.value());
            recordDenied(context, required.value());
            abort(requestContext, 403, ErrorCode.IAM_PERMISSION_DENIED_FUNCTIONAL,
                "You do not have permission for this function", params);
        }
    }

    private boolean isBlockedDuringImpersonation(SecurityContextService.TokenClaims claims) {
        if (!claims.impersonation()) {
            return false;
        }
        return resolveAnnotation(BlockDuringImpersonation.class) != null;
    }

    private <A extends java.lang.annotation.Annotation> A resolveAnnotation(Class<A> annotationType) {
        Method method = resourceInfo.getResourceMethod();
        if (method != null) {
            A annotation = method.getAnnotation(annotationType);
            if (annotation != null) {
                return annotation;
            }
        }
        Class<?> resourceClass = resourceInfo.getResourceClass();
        return resourceClass != null ? resourceClass.getAnnotation(annotationType) : null;
    }

    private void recordDenied(UserSecurityContext context, String permission) {
        recordDenied(context.tenantId(), context.userId(), "IAM_PERMISSION_DENIED", "FUNCTIONAL_PERMISSION",
            Map.of(ResponseKey.PERMISSION.getKey(), permission));
    }

    private void recordDenied(java.util.UUID tenantId, java.util.UUID actorUserId, String action,
                              String resourceType, Map<String, Object> details) {
        AuditRecorder.AuditEvent event = new AuditRecorder.AuditEvent(
            tenantId, actorUserId, action, resourceType, null, AuditResult.DENIED, details, null);
        for (AuditRecorder recorder : auditRecorders) {
            recorder.record(event);
        }
    }

    private void abort(ContainerRequestContext requestContext, int status, String code, String message,
                       Map<String, Object> params) {
        requestContext.abortWith(Response.status(status)
            .entity(new ApiErrorResponse(code, message, params))
            .build());
    }
}
