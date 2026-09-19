package com.vn9melody.openerp.modules.platform.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import com.vn9melody.openerp.modules.platform.service.PlatformHealthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/v1/platform/health")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformHealthResource {

    @Inject
    PlatformHealthService healthService;

    @GET
    public Response health() {
        PlatformResponses.Health health = healthService.health();
        return Response.ok(ApiResponse.success(PlatformErrorCode.PLATFORM_HEALTH_CHECK_SUCCESS,
            "Infrastructure health check retrieved successfully.", health)).build();
    }
}
