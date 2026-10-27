package com.vn9melody.openerp.plugins.catalog.cache;

import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Any successful catalog write rotates the tenant cache generation. This is the
 * single invalidation point, so new write endpoints cannot forget to evict.
 */
@Provider
@Priority(Priorities.HEADER_DECORATOR)
public class CatalogCacheInvalidationFilter implements ContainerResponseFilter {

    @Inject
    CatalogCache cache;

    @Inject
    TenantContext tenantContext;

    @ConfigProperty(name = "plugin.tenant-id")
    java.util.Optional<String> tenantIdConfig;

    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        String method = request.getMethod();
        boolean write = "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
        if (!write || response.getStatus() >= 400) {
            return;
        }
        UUID tenantId = tenantContext.tenantId();
        if (tenantId == null && tenantIdConfig.isPresent() && !tenantIdConfig.get().isBlank()) {
            try {
                tenantId = UUID.fromString(tenantIdConfig.get().trim());
            } catch (IllegalArgumentException ignored) {
                // no tenant context, system cache namespace only
            }
        }
        cache.invalidate(tenantId);
    }
}
