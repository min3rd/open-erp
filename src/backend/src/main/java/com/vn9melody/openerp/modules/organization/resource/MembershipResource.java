package com.vn9melody.openerp.modules.organization.resource;

import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import com.vn9melody.openerp.modules.organization.dto.MembershipDtos.MembershipRequest;
import com.vn9melody.openerp.modules.organization.dto.MembershipDtos.MembershipResponse;
import com.vn9melody.openerp.modules.organization.service.MembershipService;
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
 * User ↔ department membership lifecycle (DES-02-API section 4.3, TASK-279).
 *
 * <p>Every endpoint declares its functional permission via {@code @RequirePermission}
 * and is enforced by {@code PermissionEnforcementFilter} (TASK-267).</p>
 */
@Path("/api/v1/organization/memberships")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MembershipResource {

    @Inject
    OrganizationSecurityResolver securityResolver;

    @Inject
    OrganizationReferenceGuard referenceGuard;

    @Inject
    MembershipService membershipService;

    @Context
    HttpHeaders httpHeaders;

    @GET
    @RequirePermission("core:membership:read")
    public Response list(@QueryParam("user_id") String userId,
                         @QueryParam("branch_id") String branchId,
                         @QueryParam("department_id") String departmentId) {
        TenantPrincipal principal = authenticate();
        List<MembershipResponse> items = membershipService.list(
            principal.tenantId(),
            referenceGuard.parseUuid(userId, "user_id"),
            referenceGuard.parseUuid(branchId, "branch_id"),
            referenceGuard.parseUuid(departmentId, "department_id"));
        return Response.ok(ApiResponse.successList(
            OrganizationErrorCodes.MEMBERSHIP_LIST_SUCCESS,
            "Memberships retrieved successfully.",
            items)).build();
    }

    @POST
    @RequirePermission("core:membership:manage")
    public Response create(@Valid MembershipRequest request) {
        TenantPrincipal principal = authenticate();
        MembershipResponse data = membershipService.create(principal.tenantId(), request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            OrganizationErrorCodes.MEMBERSHIP_CREATED,
            "Membership created successfully.",
            data)).build();
    }

    @GET
    @Path("/{id}")
    @RequirePermission("core:membership:read")
    public Response get(@PathParam("id") UUID id) {
        TenantPrincipal principal = authenticate();
        var membership = membershipService.getOrThrow(principal.tenantId(), id);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.MEMBERSHIP_LIST_SUCCESS,
            "Membership retrieved successfully.",
            membershipService.list(principal.tenantId(), membership.userId, null, membership.departmentId).stream()
                .filter(item -> item.id().equals(id.toString()))
                .findFirst()
                .orElse(null))).build();
    }

    @PATCH
    @Path("/{id}")
    @RequirePermission("core:membership:manage")
    public Response patch(@PathParam("id") UUID id, @Valid MembershipRequest request) {
        return doUpdate(id, request);
    }

    @PUT
    @Path("/{id}")
    @RequirePermission("core:membership:manage")
    public Response put(@PathParam("id") UUID id, @Valid MembershipRequest request) {
        return doUpdate(id, request);
    }

    @DELETE
    @Path("/{id}")
    @RequirePermission("core:membership:manage")
    public Response delete(@PathParam("id") UUID id, @QueryParam("transfer_to") String transferTo) {
        TenantPrincipal principal = authenticate();
        membershipService.delete(principal.tenantId(), id, referenceGuard.parseUuid(transferTo, "transfer_to"));
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.MEMBERSHIP_REMOVED,
            "Membership removed successfully.",
            null)).build();
    }

    private Response doUpdate(UUID id, MembershipRequest request) {
        TenantPrincipal principal = authenticate();
        MembershipResponse data = membershipService.update(principal.tenantId(), id, request);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.MEMBERSHIP_UPDATED,
            "Membership updated successfully.",
            data)).build();
    }

    private TenantPrincipal authenticate() {
        return securityResolver.requireTenantPrincipal(
            httpHeaders != null ? httpHeaders.getHeaderString(HttpHeaders.AUTHORIZATION) : null);
    }
}
