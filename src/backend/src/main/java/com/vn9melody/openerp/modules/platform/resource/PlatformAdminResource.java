package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ListData;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformRequests;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.platform.service.PlatformAdminService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
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
import java.util.UUID;

@Path("/api/v1/platform/admins")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformAdminResource extends BasePlatformResource {

    @Inject
    PlatformAdminService adminService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @GET
    public Response list() {
        List<PlatformResponses.AdminItem> items = adminService.listAdmins();
        return Response.ok(ApiResponse.successList(PlatformErrorCode.PLATFORM_ADMIN_LIST_SUCCESS,
            "Platform admin list retrieved successfully.", items)).build();
    }

    @POST
    public Response grant(PlatformRequests.AdminGrant request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.AdminGrant body = request != null ? request : new PlatformRequests.AdminGrant();
        PlatformAdminService.GrantOutcome outcome = adminService.grant(body, actor);
        String code = outcome.invitationSent
            ? PlatformErrorCode.PLATFORM_ADMIN_INVITATION_SENT
            : PlatformErrorCode.PLATFORM_ADMIN_GRANTED;
        String message = outcome.invitationSent
            ? "Platform admin invitation sent successfully."
            : "Platform admin granted successfully.";
        return Response.status(Response.Status.CREATED)
            .entity(ApiResponse.success(code, message, outcome.response))
            .build();
    }

    @POST
    @Path("/{adminId}/disable")
    public Response disable(@PathParam("adminId") UUID adminId, PlatformRequests.ReasonConfirm request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.ReasonConfirm body = request != null ? request : new PlatformRequests.ReasonConfirm();
        PlatformResponses.AdminMutation result =
            adminService.disable(adminId, body.reason, body.confirmPassword, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_ADMIN_DISABLED,
            "Platform admin disabled successfully.", result)).build();
    }

    @POST
    @Path("/{adminId}/enable")
    public Response enable(@PathParam("adminId") UUID adminId) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformResponses.AdminMutation result = adminService.enable(adminId, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_ADMIN_ENABLED,
            "Platform admin enabled successfully.", result)).build();
    }

    @DELETE
    @Path("/{adminId}")
    public Response revoke(@PathParam("adminId") UUID adminId, PlatformRequests.ReasonConfirm request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        String reason = request != null ? request.reason : null;
        PlatformResponses.AdminMutation result = adminService.revoke(adminId, reason, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_ADMIN_REVOKED,
            "Platform admin revoked successfully.", result)).build();
    }

    @POST
    @Path("/{adminId}/reset-password")
    public Response resetPassword(@PathParam("adminId") UUID adminId) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformResponses.AdminMutation result = adminService.resetPassword(adminId, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_ADMIN_PASSWORD_RESET_SENT,
            "Platform admin password reset email sent.", result)).build();
    }

    @POST
    @Path("/{adminId}/disable-2fa")
    public Response disableTwoFactor(@PathParam("adminId") UUID adminId, PlatformRequests.BreakGlass request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.BreakGlass body = request != null ? request : new PlatformRequests.BreakGlass();
        PlatformResponses.AdminMutation result = adminService.disableTwoFactor(
            adminId, body.supportTicket, body.reason, body.confirmPassword, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_ADMIN_2FA_DISABLED,
            "Platform admin 2FA disabled via break-glass.", result)).build();
    }
}
