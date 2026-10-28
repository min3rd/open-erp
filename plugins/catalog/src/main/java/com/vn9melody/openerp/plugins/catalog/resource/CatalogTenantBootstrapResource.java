package com.vn9melody.openerp.plugins.catalog.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.catalog.api.CatalogErrorCode;
import com.vn9melody.openerp.plugins.catalog.service.CatalogAdminUnitSeeder;
import com.vn9melody.openerp.plugins.catalog.service.CatalogTenantSeeder;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.UUID;

/**
 * Per-tenant bootstrap for shared version containers. A container serves many
 * tenants, so the core calls this endpoint after install/enable with the tenant
 * identity and a short-lived data-gateway token.
 */
@Path("/internal/tenant")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CatalogTenantBootstrapResource {

    @Inject
    TenantContext tenantContext;

    @Inject
    CatalogTenantSeeder tenantSeeder;

    @Inject
    CatalogAdminUnitSeeder adminUnitSeeder;

    @POST
    @Path("/bootstrap")
    public Response bootstrap(@HeaderParam("X-Plugin-Service-Token") String serviceToken) {
        UUID tenantId = tenantContext.tenantId();
        if (tenantId == null || serviceToken == null || serviceToken.isBlank()) {
            throw new ApiException(401, CatalogErrorCode.SYSTEM_CATALOG_FORBIDDEN,
                    "Tenant bootstrap requires a tenant identity", Map.of());
        }
        tenantSeeder.seed(tenantId);
        adminUnitSeeder.seed();
        return Response.ok(ApiResponse.success(CatalogErrorCode.SYSTEM_CATALOG_SYNC_SUCCESS,
                "Tenant catalog bootstrapped successfully.", Map.of())).build();
    }
}
