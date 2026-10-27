package com.vn9melody.openerp.plugins.catalog.runtime;

import com.vn9melody.openerp.plugins.catalog.api.ApiErrorResponse;
import com.vn9melody.openerp.plugins.catalog.api.ApiException;
import com.vn9melody.openerp.plugins.catalog.api.ErrorCode;
import com.vn9melody.openerp.plugins.catalog.api.ResponseKey;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

/** Enforces {@link RequirePermission} from the gateway-forwarded caller context. */
@Provider
@Priority(Priorities.AUTHORIZATION)
public class PermissionEnforcementFilter implements ContainerRequestFilter {

    @Inject
    ResourceInfo resourceInfo;

    @Inject
    TenantContext tenantContext;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            return;
        }
        RequirePermission required = annotation();
        if (required == null || required.value().isBlank()) {
            return;
        }
        UserContext context = tenantContext.user();
        if (context.platform()) {
            return;
        }
        if (context.userId() == null || context.tenantId() == null) {
            abort(requestContext, 401, ErrorCode.UNAUTHORIZED, "A valid gateway context is required");
            return;
        }
        if (!context.hasPermission(required.value())) {
            Map<String, Object> params = new HashMap<>();
            params.put(ResponseKey.PERMISSION.getKey(), required.value());
            params.put(ResponseKey.REQUIRED_PERMISSION.getKey(), required.value());
            abort(requestContext, 403, ErrorCode.IAM_PERMISSION_DENIED_FUNCTIONAL, "Permission denied", params);
        }
    }

    private RequirePermission annotation() {
        Method method = resourceInfo.getResourceMethod();
        RequirePermission annotation = method == null ? null : method.getAnnotation(RequirePermission.class);
        if (annotation != null) {
            return annotation;
        }
        Class<?> resourceClass = resourceInfo.getResourceClass();
        return resourceClass == null ? null : resourceClass.getAnnotation(RequirePermission.class);
    }

    private void abort(ContainerRequestContext requestContext, int status, String code, String message) {
        abort(requestContext, status, code, message, Map.of());
    }

    private void abort(ContainerRequestContext requestContext, int status, String code, String message,
                       Map<String, Object> params) {
        ApiException error = new ApiException(status, code, message, params);
        requestContext.abortWith(Response.status(status)
            .type(MediaType.APPLICATION_JSON_TYPE)
            .entity(ApiErrorResponse.from(error))
            .build());
    }
}
