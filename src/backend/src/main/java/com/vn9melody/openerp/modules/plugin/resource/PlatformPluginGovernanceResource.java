package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.resource.BasePlatformResource;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.service.PluginAdminService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

/**
 * Platform governance for tenant-private plugins (DES-03-API P14/P15,
 * TASK-308): registry listing and emergency block. SUPER_ADMIN may write;
 * SUPPORT_ENGINEER keeps read-only access.
 *
 * <p><b>BUG-115</b>: the class-level path must not be the shared
 * {@code /api/v1/platform} prefix; paths under {@code /tenants} and
 * {@code /plugins} are owned by longer class-level paths of sibling resources
 * and JAX-RS never falls back to a shorter root resource. Entitlement (P12/P13)
 * lives in {@link PlatformTenantPluginEntitlementResource}, bulk apply (P10/P11)
 * and tenant support lifecycle (P19-P23) in
 * {@code PlatformPluginAdminResource}.</p>
 */
@Path("/api/v1/platform/tenant-private-plugins")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformPluginGovernanceResource extends BasePlatformResource {

    @Inject
    PluginAdminService pluginAdminService;

    @Inject
    PluginCatalogRepository catalogRepository;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @GET
    public Response listTenantPrivate() {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN && actor.role != PlatformAdminRole.SUPPORT_ENGINEER) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                    "Platform role is required to read tenant-private plugins");
        }
        List<PluginResponses.CatalogItem> items = pluginAdminService.listTenantPrivate();
        return Response.ok(ApiResponse.successList(PluginErrorCode.PLUGIN_TENANT_PRIVATE_LIST_SUCCESS,
                "Tenant-private plugins retrieved successfully.", items)).build();
    }

    @POST
    @Path("/{pluginKey}/block")
    public Response blockTenantPrivate(@PathParam("pluginKey") String pluginKey, PluginRequests.Block request) {
        PlatformActor actor = requireSuperAdmin();
        PluginCatalog catalog = catalogRepository.findByPluginKey(pluginKey);
        if (catalog == null) {
            throw new ApiException(404, PluginErrorCode.PLUGIN_NOT_FOUND, "Plugin not found");
        }
        if (catalog.visibility != PluginVisibility.TENANT_PRIVATE) {
            throw new ApiException(400, PluginErrorCode.PLUGIN_ARTIFACT_SOURCE_INVALID,
                    "This endpoint only manages tenant-private plugins");
        }
        PluginResponses.ActionResult result = pluginAdminService.blockCatalog(pluginKey, request, actor.userId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_BLOCK_SUCCESS,
                "Tenant-private plugin blocked.", result)).build();
    }

    private PlatformActor requireSuperAdmin() {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                    "Only super administrators can manage plugin governance");
        }
        return actor;
    }
}
