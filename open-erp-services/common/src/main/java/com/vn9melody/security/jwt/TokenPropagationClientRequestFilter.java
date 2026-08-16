package com.vn9melody.security.jwt;

import java.io.IOException;

import com.vn9melody.security.UserContext;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.client.ClientRequestContext;
import jakarta.ws.rs.client.ClientRequestFilter;
import jakarta.ws.rs.ext.Provider;

/**
 * Filter tự động gắn JWT Bearer Token và các Header bảo mật (Tenant, User, Department, DataScope)
 * khi 1 service gọi REST Client sang service khác.
 */
@Provider
@Priority(Priorities.AUTHENTICATION)
@ApplicationScoped
public class TokenPropagationClientRequestFilter implements ClientRequestFilter {

    @Inject
    UserContext userContext;

    @Override
    public void filter(ClientRequestContext requestContext) throws IOException {
        if (userContext == null || !userContext.isAuthenticated()) {
            return;
        }

        // 1. Tự động chuyển tiếp Authorization: Bearer <token>
        if (userContext.rawToken != null && !userContext.rawToken.isBlank()) {
            if (!requestContext.getHeaders().containsKey(JwtClaimsConstant.HEADER_AUTHORIZATION)) {
                requestContext.getHeaders().putSingle(
                        JwtClaimsConstant.HEADER_AUTHORIZATION,
                        JwtClaimsConstant.BEARER_PREFIX + userContext.rawToken);
            }
        }

        // 2. Gắn kèm các header context nếu chưa có
        if (userContext.tenantId != null) {
            requestContext.getHeaders().putSingle(JwtClaimsConstant.HEADER_X_TENANT_ID, userContext.tenantId);
        }
        if (userContext.userId != null) {
            requestContext.getHeaders().putSingle(JwtClaimsConstant.HEADER_X_USER_ID, userContext.userId.toString());
        }
        if (userContext.username != null) {
            requestContext.getHeaders().putSingle(JwtClaimsConstant.HEADER_X_USERNAME, userContext.username);
        }
        if (userContext.departmentId != null) {
            requestContext.getHeaders().putSingle(JwtClaimsConstant.HEADER_X_DEPARTMENT_ID, userContext.departmentId.toString());
        }
        if (userContext.currentScope != null) {
            requestContext.getHeaders().putSingle(JwtClaimsConstant.HEADER_X_DATA_SCOPE, userContext.currentScope.name());
        }
    }
}
