package com.vn9melody.openerp.plugins.catalog.runtime;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Reads the caller context forwarded by the core runtime gateway. The plugin
 * container is internal-only; the gateway overwrites every one of these headers
 * and never forwards client-provided values.
 */
@Provider
@Priority(Priorities.AUTHENTICATION)
public class TenantContextFilter implements ContainerRequestFilter {

    @Inject
    TenantContext tenantContext;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        UUID tenantId = uuid(requestContext.getHeaderString("X-Tenant-Id"));
        UUID userId = uuid(requestContext.getHeaderString("X-User-Id"));
        Set<String> roles = csv(requestContext.getHeaderString("X-User-Roles"));
        Set<String> permissions = csv(requestContext.getHeaderString("X-User-Permissions"));
        boolean platform = "true".equalsIgnoreCase(requestContext.getHeaderString("X-Platform"));
        tenantContext.set(tenantId, userId, roles, permissions, platform);
    }

    private UUID uuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Set<String> csv(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(item -> !item.isEmpty())
            .collect(Collectors.toUnmodifiableSet());
    }
}
