package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.modules.plugin.service.PluginRuntimeGatewayService;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import jakarta.ws.rs.core.UriInfo;
import java.util.UUID;

/**
 * Tenant runtime gateway (TASK-340): forwards requests to the plugin container
 * bound to an ACTIVE installation. Access is gated by the tenant ledger
 * (entitlement + lifecycle state), not by core permissions, so every tenant
 * user reaching an embedded plugin UI can call it.
 */
@Path("/api/v1/plugins/runtime/{pluginKey}")
public class PluginRuntimeGatewayResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    PluginRuntimeGatewayService gatewayService;

    @Context
    UriInfo uriInfo;

    @Context
    HttpHeaders httpHeaders;

    @GET
    @Path("/{path:.*}")
    public Response get(@PathParam("pluginKey") String pluginKey) {
        return forward(pluginKey, "GET", uriInfo.getPathParameters().getFirst("path"), null, null);
    }

    @POST
    @Path("/{path:.*}")
    public Response post(@PathParam("pluginKey") String pluginKey, byte[] body,
                         @HeaderParam("Content-Type") String contentType) {
        return forward(pluginKey, "POST", uriInfo.getPathParameters().getFirst("path"), contentType, body);
    }

    @PUT
    @Path("/{path:.*}")
    public Response put(@PathParam("pluginKey") String pluginKey, byte[] body,
                        @HeaderParam("Content-Type") String contentType) {
        return forward(pluginKey, "PUT", uriInfo.getPathParameters().getFirst("path"), contentType, body);
    }

    @PATCH
    @Path("/{path:.*}")
    public Response patch(@PathParam("pluginKey") String pluginKey, byte[] body,
                          @HeaderParam("Content-Type") String contentType) {
        return forward(pluginKey, "PATCH", uriInfo.getPathParameters().getFirst("path"), contentType, body);
    }

    @DELETE
    @Path("/{path:.*}")
    public Response delete(@PathParam("pluginKey") String pluginKey) {
        return forward(pluginKey, "DELETE", uriInfo.getPathParameters().getFirst("path"), null, null);
    }

    private Response forward(String pluginKey, String method, String path, String contentType, byte[] body) {
        String pluginToken = uriInfo.getQueryParameters().getFirst("plugin_token");
        if (pluginToken == null || pluginToken.isBlank()) {
            pluginToken = httpHeaders.getHeaderString("X-Plugin-Token");
        }
        UUID tenantId = null;
        UUID userId = null;
        if (pluginToken == null || pluginToken.isBlank()) {
            UserSecurityContext context = securityContextService.getCurrentContext();
            tenantId = context.tenantId();
            userId = context.userId();
        }
        PluginRuntimeGatewayService.GatewayResponse result = gatewayService.forward(
                tenantId, userId, pluginKey, pluginToken, method, path,
                UriBuilder.fromUri(uriInfo.getRequestUri()).replaceQueryParam("plugin_token")
                        .build().getRawQuery(),
                contentType, body);
        Response.ResponseBuilder builder = Response.status(result.status());
        if (result.contentType() != null && !result.contentType().isBlank()) {
            builder.type(result.contentType());
        }
        return builder.entity(result.body() == null ? new byte[0] : result.body()).build();
    }
}
