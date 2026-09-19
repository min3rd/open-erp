package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.PagedData;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformPage;
import com.vn9melody.openerp.modules.platform.dto.PlatformRequests;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.platform.service.PlatformUserService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;

@Path("/api/v1/platform/users")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformUserResource extends BasePlatformResource {

    @Inject
    PlatformUserService userService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @GET
    public Response list(@QueryParam("page") Integer page, @QueryParam("size") Integer size,
                         @QueryParam("status") String status, @QueryParam("keyword") String keyword,
                         @QueryParam("tenant_id") String tenantId) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 200);
        UUID parsedTenantId = tenantId == null || tenantId.isBlank() ? null : UUID.fromString(tenantId);
        PlatformPage<PlatformResponses.UserItem> result =
            userService.listUsers(status, keyword, parsedTenantId, safePage, safeSize);
        PagedData<PlatformResponses.UserItem> data =
            PagedData.of(result.items, safePage, safeSize, result.totalItems);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_USER_LIST_SUCCESS,
            "Global user list retrieved successfully.", data)).build();
    }

    @POST
    @Path("/{userId}/lock")
    public Response lock(@PathParam("userId") UUID userId, PlatformRequests.ReasonConfirm request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.ReasonConfirm body = request != null ? request : new PlatformRequests.ReasonConfirm();
        PlatformResponses.UserStatus status = userService.lockUser(userId, body.reason, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_USER_LOCKED_SUCCESS,
            "User locked successfully.", status)).build();
    }

    @POST
    @Path("/{userId}/unlock")
    public Response unlock(@PathParam("userId") UUID userId) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformResponses.UserStatus status = userService.unlockUser(userId, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_USER_UNLOCKED_SUCCESS,
            "User unlocked successfully.", status)).build();
    }

    @POST
    @Path("/{userId}/force-password-reset")
    public Response forcePasswordReset(@PathParam("userId") UUID userId, PlatformRequests.ReasonConfirm request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.ReasonConfirm body = request != null ? request : new PlatformRequests.ReasonConfirm();
        PlatformResponses.UserReset result = userService.forcePasswordReset(userId, body.reason, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_USER_PASSWORD_RESET_FORCED,
            "User password reset forced.", result)).build();
    }

    @POST
    @Path("/{userId}/break-glass")
    public Response breakGlass(@PathParam("userId") UUID userId, PlatformRequests.BreakGlass request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.BreakGlass body = request != null ? request : new PlatformRequests.BreakGlass();
        PlatformResponses.BreakGlassResult result = userService.breakGlass(
            userId, body.action, body.supportTicket, body.reason, body.confirmPassword, actor);
        String code = "DISABLE_2FA".equalsIgnoreCase(result.action)
            ? PlatformErrorCode.PLATFORM_USER_2FA_DISABLED_BY_BREAK_GLASS
            : PlatformErrorCode.PLATFORM_USER_PASSWORD_RESET_FORCED;
        return Response.ok(ApiResponse.success(code, "Break-glass action completed.", result)).build();
    }

    @POST
    @Path("/{userId}/break-glass/disable-2fa")
    public Response breakGlassDisable2Fa(@PathParam("userId") UUID userId, PlatformRequests.BreakGlass request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.BreakGlass body = request != null ? request : new PlatformRequests.BreakGlass();
        PlatformResponses.BreakGlassResult result = userService.breakGlass(
            userId, "DISABLE_2FA", body.supportTicket, body.reason, body.confirmPassword, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_USER_2FA_DISABLED_BY_BREAK_GLASS,
            "2FA disabled via break-glass.", result)).build();
    }
}
