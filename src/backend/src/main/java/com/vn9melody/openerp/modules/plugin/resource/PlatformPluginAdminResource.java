package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.resource.BasePlatformResource;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Platform plugin catalog administration (DES-03-API section 3, TASK-303):
 * P2/P3/P5/P6/P7/P8/P24/P25/P26. Only SUPER_ADMIN may write; SUPPORT_ENGINEER
 * keeps read-only access to plugin detail.
 */
@Path("/api/v1/platform/plugins")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformPluginAdminResource extends BasePlatformResource {

    @Inject
    PluginAdminService pluginAdminService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @POST
    public Response create(PluginRequests.RegisterCatalog request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.CatalogItem item = pluginAdminService.createCatalog(request, actor.userId);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                PluginErrorCode.PLUGIN_REGISTER_SUCCESS, "Plugin registered successfully.", item)).build();
    }

    @GET
    @Path("/{pluginKey}")
    public Response detail(@PathParam("pluginKey") String pluginKey) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN && actor.role != PlatformAdminRole.SUPPORT_ENGINEER) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED, "Platform role is required");
        }
        PluginResponses.CatalogDetail detail = pluginAdminService.getDetail(pluginKey);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_DETAIL_SUCCESS,
                "Plugin detail retrieved successfully.", detail)).build();
    }

    @PATCH
    @Path("/{pluginKey}")
    public Response update(@PathParam("pluginKey") String pluginKey, PluginRequests.UpdateCatalog request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.CatalogItem item = pluginAdminService.updateCatalog(pluginKey, request, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_METADATA_UPDATE_SUCCESS,
                "Plugin metadata updated successfully.", item)).build();
    }

    @DELETE
    @Path("/{pluginKey}")
    public Response delete(@PathParam("pluginKey") String pluginKey) {
        PlatformActor actor = requireSuperAdmin();
        pluginAdminService.deleteCatalog(pluginKey, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CATALOG_DELETE_SUCCESS,
                "Plugin catalog entry deleted successfully.", null)).build();
    }

    @POST
    @Path("/{pluginKey}/versions")
    public Response registerVersion(@PathParam("pluginKey") String pluginKey,
                                    PluginRequests.RegisterVersion request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.VersionItem item = pluginAdminService.registerVersion(pluginKey, request, actor.userId);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                PluginErrorCode.PLUGIN_VERSION_ADD_SUCCESS, "Plugin version registered.", item)).build();
    }

    @PATCH
    @Path("/{pluginKey}/versions/{version}")
    public Response versionAction(@PathParam("pluginKey") String pluginKey,
                                  @PathParam("version") String version,
                                  PluginRequests.VersionAction request) {
        PlatformActor actor = requireSuperAdmin();
        String action = request != null && request.action != null ? request.action.trim().toUpperCase() : "";
        if ("PUBLISH".equals(action)) {
            PluginResponses.ActionResult result = pluginAdminService.publishVersion(pluginKey, version,
                    request != null ? request.reason : null, actor.userId);
            return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_PUBLISH_SUCCESS,
                    "Plugin version published.", result)).build();
        }
        if ("DEPRECATE".equals(action)) {
            PluginResponses.ActionResult result = pluginAdminService.deprecateVersion(pluginKey, version,
                    request != null ? request.reason : null, actor.userId);
            return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_DEPRECATE_SUCCESS,
                    "Plugin version deprecated.", result)).build();
        }
        if ("BLOCK".equals(action)) {
            PluginResponses.ActionResult result = pluginAdminService.blockVersion(pluginKey, version,
                    request != null ? request.reason : null, actor.userId);
            return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BLOCK_SUCCESS,
                    "Plugin version blocked.", result)).build();
        }
        throw new ApiException(400, PluginErrorCode.PLUGIN_VERSION_NOT_VERIFIED, "Unsupported version action");
    }

    @PATCH
    @Path("/{pluginKey}/versions/{version}/unblock")
    public Response unblockVersion(@PathParam("pluginKey") String pluginKey,
                                   @PathParam("version") String version,
                                   PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.ActionResult result = pluginAdminService.unblockVersion(pluginKey, version,
                request != null ? request.reason : null, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UNBLOCK_SUCCESS,
                "Plugin version unblocked.", result)).build();
    }

    @POST
    @Path("/{pluginKey}/block")
    public Response block(@PathParam("pluginKey") String pluginKey, PluginRequests.Block request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.ActionResult result = pluginAdminService.blockCatalog(pluginKey, request, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BLOCK_SUCCESS,
                "Plugin blocked successfully.", result)).build();
    }

    @POST
    @Path("/{pluginKey}/unblock")
    public Response unblock(@PathParam("pluginKey") String pluginKey, PluginRequests.Reason request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.ActionResult result = pluginAdminService.unblockCatalog(pluginKey,
                request != null ? request.reason : null, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_UNBLOCK_SUCCESS,
                "Plugin catalog unblocked.", result)).build();
    }

    private PlatformActor requireSuperAdmin() {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                    "Only super administrators can manage the plugin catalog");
        }
        return actor;
    }
}
