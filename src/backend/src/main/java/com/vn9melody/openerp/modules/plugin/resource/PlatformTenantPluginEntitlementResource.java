package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAction;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.resource.BasePlatformResource;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginAuditService;
import com.vn9melody.openerp.modules.plugin.service.PluginEntitlementService;
import com.vn9melody.openerp.core.api.ApiException;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;

/**
 * Platform entitlement management on the single tenant_plugins ledger
 * (DES-03-API P12/P13, TASK-306/308). SUPER_ADMIN only; audit actor is the real
 * platform admin.
 *
 * <p><b>BUG-115</b>: the class-level path must be longer than
 * {@code /api/v1/platform/tenants} (owned by {@code PlatformTenantResource}) or
 * JAX-RS root-resource matching picks the tenant resource first and never falls
 * back to this class, returning 404 for every method.</p>
 */
@Path("/api/v1/platform/tenants/{tenantId}/plugins")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformTenantPluginEntitlementResource extends BasePlatformResource {

    @Inject
    PluginEntitlementService entitlementService;

    @Inject
    PluginAuditService auditService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @PUT
    @Path("/{pluginKey}/entitlement")
    public Response grantEntitlement(@PathParam("tenantId") UUID tenantId,
                                     @PathParam("pluginKey") String pluginKey) {
        PlatformActor actor = requireSuperAdmin();
        entitlementService.grant(tenantId, pluginKey);
        auditService.platform(actor.userId, PlatformAction.PLUGIN_ENTITLEMENT_GRANTED, pluginKey, tenantId, null, null);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ENTITLEMENT_GRANT_SUCCESS,
                "Entitlement granted.", entitlementResult(pluginKey, "NOT_INSTALLED"))).build();
    }

    @DELETE
    @Path("/{pluginKey}/entitlement")
    public Response revokeEntitlement(@PathParam("tenantId") UUID tenantId,
                                      @PathParam("pluginKey") String pluginKey) {
        PlatformActor actor = requireSuperAdmin();
        entitlementService.revoke(tenantId, pluginKey);
        auditService.platform(actor.userId, PlatformAction.PLUGIN_ENTITLEMENT_REVOKED, pluginKey, tenantId, null, null);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_ENTITLEMENT_REVOKE_SUCCESS,
                "Entitlement revoked.", entitlementResult(pluginKey, null))).build();
    }

    private PluginResponses.ActionResult entitlementResult(String pluginKey, String status) {
        PluginResponses.ActionResult result = new PluginResponses.ActionResult();
        result.pluginKey = pluginKey;
        result.catalogStatus = status;
        return result;
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
