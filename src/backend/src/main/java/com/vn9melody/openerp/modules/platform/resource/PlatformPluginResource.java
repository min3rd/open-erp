package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.platform.service.PluginCatalogService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

/**
 * Platform plugin catalog (FEAT-20). Non-paginated list contract
 * {@code data.items = [{key, name_key, description_key, is_core}]}; only
 * SUPER_ADMIN may read it (SUPPORT_ENGINEER stays read-only on other surfaces).
 */
@Path("/api/v1/platform/plugins")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformPluginResource extends BasePlatformResource {

    @Inject
    PluginCatalogService pluginCatalogService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @GET
    public Response list() {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                "Only super administrators can read the plugin catalog");
        }
        List<PlatformResponses.PluginItem> items = pluginCatalogService.listPlugins();
        return Response.ok(ApiResponse.successList(PlatformErrorCode.PLATFORM_PLUGIN_LIST_SUCCESS,
            "Plugin catalog retrieved successfully.", items)).build();
    }
}
