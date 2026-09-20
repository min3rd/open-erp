package com.vn9melody.openerp.modules.plugin.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PluginCredentialScope;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.resource.BasePlatformResource;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.dto.PluginRequests;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.service.PluginCredentialService;
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
import java.util.List;
import java.util.UUID;

/**
 * Platform registry credentials (P16-P18, TASK-336). Secrets are never returned.
 */
@Path("/api/v1/platform/plugin-credentials")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformPluginCredentialResource extends BasePlatformResource {

    @Inject
    PluginCredentialService credentialService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @GET
    public Response list() {
        requireSuperAdmin();
        List<PluginResponses.CredentialItem> items =
                credentialService.list(PluginCredentialScope.PLATFORM, null);
        return Response.ok(ApiResponse.successList(PluginErrorCode.PLUGIN_CREDENTIAL_LIST_SUCCESS,
                "Credentials retrieved successfully.", items)).build();
    }

    @POST
    public Response create(PluginRequests.Credential request) {
        PlatformActor actor = requireSuperAdmin();
        PluginResponses.CredentialItem item = credentialService.create(PluginCredentialScope.PLATFORM, null,
                request.name, request.registryHost, request.username, request.secret, actor.userId);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
                PluginErrorCode.PLUGIN_CREDENTIAL_CREATED, "Credential created.", item)).build();
    }

    @PATCH
    @Path("/{credentialId}")
    public Response update(@PathParam("credentialId") UUID credentialId, PluginRequests.CredentialUpdate request) {
        requireSuperAdmin();
        PluginResponses.CredentialItem item = credentialService.update(credentialId,
                request != null ? request.name : null,
                request != null ? request.username : null,
                request != null ? request.secret : null);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CREDENTIAL_UPDATED,
                "Credential updated.", item)).build();
    }

    @DELETE
    @Path("/{credentialId}")
    public Response delete(@PathParam("credentialId") UUID credentialId) {
        requireSuperAdmin();
        credentialService.delete(credentialId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CREDENTIAL_DELETED,
                "Credential deleted.", null)).build();
    }

    @POST
    @Path("/{credentialId}/test")
    public Response test(@PathParam("credentialId") UUID credentialId) {
        requireSuperAdmin();
        PluginResponses.CredentialItem item = credentialService.test(credentialId);
        return Response.ok(ApiResponse.success(PluginErrorCode.PLUGIN_CREDENTIAL_TEST_SUCCESS,
                "Registry reachable with this credential.", item)).build();
    }

    private PlatformActor requireSuperAdmin() {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        if (actor.role != PlatformAdminRole.SUPER_ADMIN) {
            throw new ApiException(403, PlatformErrorCode.PLATFORM_ACCESS_DENIED,
                    "Only super administrators can manage registry credentials");
        }
        return actor;
    }
}
