package com.vn9melody.openerp.plugins.organization.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugins.organization.api.OrganizationErrorCode;
import com.vn9melody.openerp.plugins.organization.dto.OrganizationDtos.BootstrapResult;
import com.vn9melody.openerp.plugins.organization.service.OrganizationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * Core runtime bootstrap endpoint. Internal-only: the core deployer sends the
 * service token and tenant headers after plugin activation.
 */
@Path("/internal/tenant")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrganizationBootstrapResource {

    @Inject
    OrganizationService service;

    @POST
    @Path("/bootstrap")
    public ApiResponse<BootstrapResult> bootstrap() {
        return ApiResponse.success(
            OrganizationErrorCode.BOOTSTRAP_SUCCESS,
            "Organization defaults provisioned.",
            service.bootstrap());
    }
}
