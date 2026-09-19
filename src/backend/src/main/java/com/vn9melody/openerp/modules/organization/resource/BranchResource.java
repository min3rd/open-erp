package com.vn9melody.openerp.modules.organization.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import com.vn9melody.openerp.modules.organization.dto.BranchDtos.BranchRequest;
import com.vn9melody.openerp.modules.organization.dto.BranchDtos.BranchResponse;
import com.vn9melody.openerp.modules.organization.model.Branch;
import com.vn9melody.openerp.modules.organization.service.BranchService;
import com.vn9melody.openerp.modules.organization.service.OrganizationSecurityResolver;
import com.vn9melody.openerp.modules.organization.service.OrganizationSecurityResolver.TenantPrincipal;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * Organization branch CRUD (DES-02-API section 4.1).
 *
 * <p>TODO(wave-integration): attach {@code @RequirePermission("core:branch:read")} /
 * {@code @RequirePermission("core:branch:manage")} once the shared annotation ships.</p>
 */
@Path("/api/v1/organization/branches")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BranchResource {

    @Inject
    OrganizationSecurityResolver securityResolver;

    @Inject
    BranchService branchService;

    @Context
    HttpHeaders httpHeaders;

    @GET
    public Response list() {
        TenantPrincipal principal = authenticate();
        List<BranchResponse> items = branchService.list(principal.tenantId());
        return Response.ok(ApiResponse.successList(
            OrganizationErrorCodes.BRANCH_LIST_SUCCESS,
            "Branches retrieved successfully.",
            items)).build();
    }

    @POST
    public Response create(@Valid BranchRequest request) {
        TenantPrincipal principal = authenticate();
        BranchResponse data = branchService.create(principal.tenantId(), request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            OrganizationErrorCodes.BRANCH_CREATED_SUCCESS,
            "Branch created successfully.",
            data)).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") UUID id) {
        TenantPrincipal principal = authenticate();
        Branch branch = branchService.getOrThrow(principal.tenantId(), id);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.BRANCH_LIST_SUCCESS,
            "Branch retrieved successfully.",
            BranchResponse.from(branch))).build();
    }

    @PATCH
    @Path("/{id}")
    public Response patch(@PathParam("id") UUID id, @Valid BranchRequest request) {
        return doUpdate(id, request);
    }

    @PUT
    @Path("/{id}")
    public Response put(@PathParam("id") UUID id, @Valid BranchRequest request) {
        return doUpdate(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        TenantPrincipal principal = authenticate();
        branchService.softDelete(principal.tenantId(), id);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.BRANCH_DELETED,
            "Branch deleted successfully.",
            null)).build();
    }

    private Response doUpdate(UUID id, BranchRequest request) {
        TenantPrincipal principal = authenticate();
        BranchResponse data = branchService.update(principal.tenantId(), id, request);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.BRANCH_UPDATED,
            "Branch updated successfully.",
            data)).build();
    }

    private TenantPrincipal authenticate() {
        return securityResolver.requireTenantPrincipal(
            httpHeaders != null ? httpHeaders.getHeaderString(HttpHeaders.AUTHORIZATION) : null);
    }
}
