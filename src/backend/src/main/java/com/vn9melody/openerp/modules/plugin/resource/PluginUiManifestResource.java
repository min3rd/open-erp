package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginUiManifestService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Shared UI manifest API (DES-03-API section 5.1, TASK-309): menu screens +
 * slots + contributions for the calling tenant/user.
 */
@Path("/api/v1/plugins/ui-manifest")
@Produces(MediaType.APPLICATION_JSON)
public class PluginUiManifestResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    PluginUiManifestService uiManifestService;

    @GET
    public Response manifest() {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PluginResponses.UiManifest manifest = uiManifestService.build(context);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UI_MANIFEST_SUCCESS,
                "UI manifest retrieved successfully.", manifest)).build();
    }
}
