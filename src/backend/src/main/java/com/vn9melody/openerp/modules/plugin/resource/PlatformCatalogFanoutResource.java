package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.service.PluginFanoutService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

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
}
