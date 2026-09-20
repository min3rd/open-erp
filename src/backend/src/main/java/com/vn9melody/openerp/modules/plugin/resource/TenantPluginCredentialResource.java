package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.context.UserSecurityContext;
import com.vn9melody.openerp.core.enums.PluginCredentialScope;
import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginCredentialService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * Tenant registry credentials (T10-T11, TASK-336) for private plugin registries.
 */
@Path("/api/v1/tenant/plugin-credentials")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TenantPluginCredentialResource {

    @Inject
    SecurityContextService securityContextService;

    @Inject
    PluginCredentialService credentialService;

    @GET
    @RequirePermission("core:plugin:credential:manage")
    public Response list() {
        UserSecurityContext context = securityContextService.getCurrentContext();
        List<PluginResponses.CredentialItem> items =
                credentialService.list(PluginCredentialScope.TENANT, context.tenantId());
        return Response.ok(ApiResponse.successList(PluginErrorCode.PLUGIN_CREDENTIAL_LIST_SUCCESS,
                "Credentials retrieved successfully.", items)).build();
    }

    @POST
    @RequirePermission("core:plugin:credential:manage")
    public Response create(PluginRequests.Credential request) {
        UserSecurityContext context = securityContextService.getCurrentContext();
        PluginResponses.CredentialItem item = credentialService.create(PluginCredentialScope.TENANT,
                context.tenantId(), request.name, request.registryHost, request.username, request.secret,
                context.userId());
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                PluginErrorCode.PLUGIN_CREDENTIAL_CREATED, "Credential created.", item)).build();
    }

    @DELETE
    @Path("/{credentialId}")
    @RequirePermission("core:plugin:credential:manage")
    public Response delete(@PathParam("credentialId") UUID credentialId) {
        securityContextService.getCurrentContext();
        credentialService.delete(credentialId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CREDENTIAL_DELETED,
                "Credential deleted.", null)).build();
    }

    @POST
    @Path("/{credentialId}/test")
    @RequirePermission("core:plugin:credential:manage")
    public Response test(@PathParam("credentialId") UUID credentialId) {
        securityContextService.getCurrentContext();
        PluginResponses.CredentialItem item = credentialService.test(credentialId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CREDENTIAL_TEST_SUCCESS,
                "Registry reachable with this credential.", item)).build();
    }
}
