package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.PagedData;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformPage;
import com.vn9melody.openerp.modules.platform.dto.PlatformRequests;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.service.PlatformActor;
import com.vn9melody.openerp.modules.platform.service.PlatformTenantService;
import io.vertx.core.http.HttpServerRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
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

@Path("/api/v1/platform/tenants")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformTenantResource extends BasePlatformResource {

    @Inject
    PlatformTenantService tenantService;

    @Inject
    com.vn9melody.openerp.modules.platform.service.ImpersonationService impersonationService;

    @Context
    ContainerRequestContext requestContext;

    @Context
    HttpServerRequest serverRequest;

    @Context
    HttpHeaders headers;

    @GET
    public Response list(@QueryParam("page") Integer page, @QueryParam("size") Integer size,
                         @QueryParam("status") String status, @QueryParam("keyword") String keyword) {
        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size <= 0 ? 20 : Math.min(size, 200);
        PlatformPage<PlatformResponses.TenantItem> result =
            tenantService.listTenants(status, keyword, safePage, safeSize);
        PagedData<PlatformResponses.TenantItem> data = PagedData.of(
            result.items, safePage, safeSize, result.totalItems);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_TENANT_LIST_SUCCESS,
            "Tenant list retrieved successfully.", data)).build();
    }

    @GET
    @Path("/{tenantId}")
    public Response detail(@PathParam("tenantId") UUID tenantId) {
        PlatformResponses.TenantDetail detail = tenantService.getTenant(tenantId);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_TENANT_DETAIL_SUCCESS,
            "Tenant detail retrieved successfully.", detail)).build();
    }

    @PATCH
    @Path("/{tenantId}/quotas")
    public Response updateQuotasPatch(@PathParam("tenantId") UUID tenantId,
                                      PlatformRequests.QuotaUpdate request) {
        return updateQuotas(tenantId, request);
    }

    @PUT
    @Path("/{tenantId}/quotas")
    public Response updateQuotasPut(@PathParam("tenantId") UUID tenantId,
                                    PlatformRequests.QuotaUpdate request) {
        return updateQuotas(tenantId, request);
    }

    @POST
    @Path("/{tenantId}/lock")
    public Response lock(@PathParam("tenantId") UUID tenantId, PlatformRequests.ReasonConfirm request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.ReasonConfirm body = request != null ? request : new PlatformRequests.ReasonConfirm();
        PlatformResponses.TenantStatus status =
            tenantService.lockTenant(tenantId, body.reason, body.confirmPassword, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_TENANT_LOCK_SUCCESS,
            "Tenant locked successfully.", status)).build();
    }

    @POST
    @Path("/{tenantId}/unlock")
    public Response unlock(@PathParam("tenantId") UUID tenantId, PlatformRequests.Confirm request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.Confirm body = request != null ? request : new PlatformRequests.Confirm();
        PlatformResponses.TenantStatus status = tenantService.unlockTenant(tenantId, body.confirmPassword, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_TENANT_UNLOCK_SUCCESS,
            "Tenant unlocked successfully.", status)).build();
    }

    @POST
    @Path("/{tenantId}/impersonate")
    public Response impersonate(@PathParam("tenantId") UUID tenantId, PlatformRequests.Impersonate request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformRequests.Impersonate body = request != null ? request : new PlatformRequests.Impersonate();
        PlatformResponses.ImpersonationStart result = impersonationService.start(tenantId, body, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_IMPERSONATION_STARTED,
            "Impersonation session started successfully.", result)).build();
    }

    private Response updateQuotas(UUID tenantId, PlatformRequests.QuotaUpdate request) {
        PlatformActor actor = actor(requestContext, serverRequest, headers);
        PlatformResponses.Quota quota = tenantService.updateQuotas(tenantId, request, actor);
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_TENANT_QUOTA_UPDATED,
            "Tenant quota updated successfully.", quota)).build();
    }
}
