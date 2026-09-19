package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.api.PagedData;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformPage;
import com.vn9melody.openerp.modules.platform.dto.PlatformRequests;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.service.ImpersonationService;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.platform.service.PlatformJwtService;
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
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/v1/platform")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformImpersonationResource extends BasePlatformResource {

    @Inject
    ImpersonationService impersonationService;

    @Inject
    PlatformJwtService platformJwtService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @POST
    @Path("/impersonate/exit")
    public Response exit() {
        return doExit();
    }

    @POST
    @Path("/impersonation/exit")
    public Response exitAlias() {
        return doExit();
    }

    @GET
    @Path("/impersonation-logs")
    public Response listLogs(@QueryParam("page") Integer page, @QueryParam("size") Integer size,
                             @QueryParam("super_admin_user_id") String superAdminUserId,
                             @QueryParam("tenant_id") String tenantId,
                             @QueryParam("status") String status) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 200);
        UUID parsedAdminId = superAdminUserId == null || superAdminUserId.isBlank()
            ? null : UUID.fromString(superAdminUserId);
        UUID parsedTenantId = tenantId == null || tenantId.isBlank() ? null : UUID.fromString(tenantId);
        PlatformPage<PlatformResponses.ImpersonationLogItem> result =
            impersonationService.listLogs(parsedAdminId, parsedTenantId, status, safePage, safeSize);
        PagedData<PlatformResponses.ImpersonationLogItem> data =
            PagedData.of(result.items, safePage, safeSize, result.totalItems);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_IMPERSONATION_LOG_LIST_SUCCESS,
            "Impersonation logs retrieved successfully.", data)).build();
    }

    private Response doExit() {
        String authorization = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                || authorization.substring(7).trim().isEmpty()) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Impersonation token required");
        }
        JsonWebToken jwt;
        try {
            jwt = platformJwtService.parse(authorization.substring(7).trim());
        } catch (Exception e) {
            throw new ApiException(401, PlatformErrorCode.PLATFORM_IMPERSONATION_SESSION_EXPIRED,
                "Impersonation session expired or not found");
        }
        impersonationService.exit(jwt);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_IMPERSONATION_ENDED,
            "Impersonation session ended successfully.", null)).build();
    }
}
