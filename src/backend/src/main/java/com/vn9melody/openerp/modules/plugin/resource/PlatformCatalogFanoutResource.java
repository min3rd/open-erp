package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.service.PluginFanoutService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;

/**
 * Platform-scoped trigger for the catalog system-catalog fan-out. The platform
 * role filter guards the /api/v1/platform prefix; the plugin manager only
 * orchestrates, the catalog plugin owns the data.
 */
@Path("/api/v1/platform/plugins/catalog")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformCatalogFanoutResource {

    @Inject
    PluginFanoutService fanoutService;

    @POST
    @Path("/fanout")
    public Response fanout() {
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CATALOG_FANOUT_SUCCESS,
            "Catalog system data fan-out completed.", fanoutService.fanoutCatalog())).build();
    }

    @POST
    @Path("/tenants/{tenantId}/sync")
    public Response tenantSync(@PathParam("tenantId") UUID tenantId, JsonNode body) {
        String code = body == null ? "" : body.path("code").asText("");
        JsonNode conflicts = body == null ? null : body.path("conflicts");
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CATALOG_FANOUT_SUCCESS,
            "Tenant catalog sync completed.",
            fanoutService.syncTenantCatalog(tenantId, code, conflicts))).build();
    }
}
