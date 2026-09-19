package com.vn9melody.openerp.modules.organization.resource;

import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import com.vn9melody.openerp.modules.organization.dto.BranchAssignmentDtos.BranchAssignmentCreateRequest;
import com.vn9melody.openerp.modules.organization.dto.BranchAssignmentDtos.BranchAssignmentResponse;
import com.vn9melody.openerp.modules.organization.dto.BranchAssignmentDtos.BranchAssignmentUpdateRequest;
import com.vn9melody.openerp.modules.organization.service.BranchAssignmentService;
import com.vn9melody.openerp.modules.organization.service.OrganizationReferenceGuard;
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
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * Multi-branch manager assignments ({@code user_branch_assignments}, DES-02-API section 4.4,
 * BR-RBAC-08/09). Every change publishes a cache invalidation event for the affected user.
 *
 * <p>Every endpoint declares its functional permission via {@code @RequirePermission}
 * and is enforced by {@code PermissionEnforcementFilter} (TASK-267).</p>
 */
@Path("/api/v1/organization/branch-assignments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BranchAssignmentResource {

    @Inject
    OrganizationSecurityResolver securityResolver;

    @Inject
    OrganizationReferenceGuard referenceGuard;

    @Inject
    BranchAssignmentService branchAssignmentService;

    @Context
    HttpHeaders httpHeaders;

    @GET
    @RequirePermission("core:branch-assignment:read")
    public Response list(@QueryParam("user_id") String userId,
                         @QueryParam("branch_id") String branchId) {
        TenantPrincipal principal = authenticate();
        List<BranchAssignmentResponse> items = branchAssignmentService.list(
            principal.tenantId(),
            referenceGuard.parseUuid(userId, "user_id"),
            referenceGuard.parseUuid(branchId, "branch_id"));
        return Response.ok(ApiResponse.successList(
            OrganizationErrorCodes.BRANCH_ASSIGNMENT_LIST_SUCCESS,
            "Branch assignments retrieved successfully.",
            items)).build();
    }

    @POST
    @RequirePermission("core:branch-assignment:manage")
    public Response create(@Valid BranchAssignmentCreateRequest request) {
        TenantPrincipal principal = authenticate();
        BranchAssignmentResponse data = branchAssignmentService.create(principal.tenantId(), request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            OrganizationErrorCodes.BRANCH_ASSIGNMENT_CREATED,
            "Branch assignment created successfully.",
            data)).build();
    }

    @GET
    @Path("/{id}")
    @RequirePermission("core:branch-assignment:read")
    public Response get(@PathParam("id") UUID id) {
        TenantPrincipal principal = authenticate();
        var assignment = branchAssignmentService.getOrThrow(principal.tenantId(), id);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.BRANCH_ASSIGNMENT_LIST_SUCCESS,
            "Branch assignment retrieved successfully.",
            branchAssignmentService.list(principal.tenantId(), assignment.userId, assignment.branchId).stream()
                .filter(item -> item.id().equals(id.toString()))
                .findFirst()
                .orElse(null))).build();
    }

    @PATCH
    @Path("/{id}")
    @RequirePermission("core:branch-assignment:manage")
    public Response patch(@PathParam("id") UUID id, @Valid BranchAssignmentUpdateRequest request) {
        return doUpdate(id, request);
    }

    @PUT
    @Path("/{id}")
    @RequirePermission("core:branch-assignment:manage")
    public Response put(@PathParam("id") UUID id, @Valid BranchAssignmentUpdateRequest request) {
        return doUpdate(id, request);
    }

    @DELETE
    @Path("/{id}")
    @RequirePermission("core:branch-assignment:manage")
    public Response delete(@PathParam("id") UUID id) {
        TenantPrincipal principal = authenticate();
        branchAssignmentService.delete(principal.tenantId(), id);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.BRANCH_ASSIGNMENT_REMOVED,
            "Branch assignment removed successfully.",
            null)).build();
    }

    private Response doUpdate(UUID id, BranchAssignmentUpdateRequest request) {
        TenantPrincipal principal = authenticate();
        BranchAssignmentResponse data = branchAssignmentService.update(principal.tenantId(), id, request);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.BRANCH_ASSIGNMENT_UPDATED,
            "Branch assignment updated successfully.",
            data)).build();
    }

    private TenantPrincipal authenticate() {
        return securityResolver.requireTenantPrincipal(
            httpHeaders != null ? httpHeaders.getHeaderString(HttpHeaders.AUTHORIZATION) : null);
    }
}
