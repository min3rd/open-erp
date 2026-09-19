package com.vn9melody.openerp.modules.organization.resource;

import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.organization.OrganizationErrorCodes;
import com.vn9melody.openerp.modules.organization.dto.DepartmentDtos.DepartmentMoveRequest;
import com.vn9melody.openerp.modules.organization.dto.DepartmentDtos.DepartmentNodeResponse;
import com.vn9melody.openerp.modules.organization.dto.DepartmentDtos.DepartmentRequest;
import com.vn9melody.openerp.modules.organization.service.DepartmentService;
import com.vn9melody.openerp.modules.organization.service.OrganizationSecurityResolver;
import com.vn9melody.openerp.modules.organization.service.OrganizationSecurityResolver.TenantPrincipal;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
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
 * Department hierarchy CRUD + move (DES-02-API section 4.2, TASK-279).
 *
 * <p>Every endpoint declares its functional permission via {@code @RequirePermission}
 * and is enforced by {@code PermissionEnforcementFilter} (TASK-267).</p>
 */
@Path("/api/v1/organization/departments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DepartmentResource {

    @Inject
    OrganizationSecurityResolver securityResolver;

    @Inject
    DepartmentService departmentService;

    @Context
    HttpHeaders httpHeaders;

    @GET
    @RequirePermission("core:department:read")
    public Response list(@QueryParam("tree") @DefaultValue("true") boolean tree) {
        TenantPrincipal principal = authenticate();
        List<DepartmentNodeResponse> items = departmentService.tree(principal.tenantId());
        return Response.ok(ApiResponse.successList(
            tree ? OrganizationErrorCodes.DEPARTMENT_TREE_SUCCESS : OrganizationErrorCodes.DEPARTMENT_LIST_SUCCESS,
            "Department hierarchy retrieved successfully.",
            items)).build();
    }

    @GET
    @Path("/tree")
    @RequirePermission("core:department:read")
    public Response tree() {
        TenantPrincipal principal = authenticate();
        List<DepartmentNodeResponse> items = departmentService.tree(principal.tenantId());
        return Response.ok(ApiResponse.successList(
            OrganizationErrorCodes.DEPARTMENT_TREE_SUCCESS,
            "Department hierarchy retrieved successfully.",
            items)).build();
    }

    @POST
    @RequirePermission("core:department:manage")
    public Response create(@Valid DepartmentRequest request) {
        TenantPrincipal principal = authenticate();
        DepartmentNodeResponse data = departmentService.create(principal.tenantId(), request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            OrganizationErrorCodes.DEPARTMENT_CREATED_SUCCESS,
            "Department created successfully.",
            data)).build();
    }

    @GET
    @Path("/{id}")
    @RequirePermission("core:department:read")
    public Response get(@PathParam("id") UUID id) {
        TenantPrincipal principal = authenticate();
        departmentService.getOrThrow(principal.tenantId(), id);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.DEPARTMENT_TREE_SUCCESS,
            "Department retrieved successfully.",
            departmentService.tree(principal.tenantId()))).build();
    }

    @PATCH
    @Path("/{id}")
    @RequirePermission("core:department:manage")
    public Response patch(@PathParam("id") UUID id, @Valid DepartmentRequest request) {
        return doUpdate(id, request);
    }

    @PUT
    @Path("/{id}")
    @RequirePermission("core:department:manage")
    public Response put(@PathParam("id") UUID id, @Valid DepartmentRequest request) {
        return doUpdate(id, request);
    }

    @POST
    @Path("/{id}/move")
    @RequirePermission("core:department:manage")
    public Response move(@PathParam("id") UUID id, @Valid DepartmentMoveRequest request) {
        return doMove(id, request);
    }

    @PUT
    @Path("/{id}/move")
    @RequirePermission("core:department:manage")
    public Response movePut(@PathParam("id") UUID id, @Valid DepartmentMoveRequest request) {
        return doMove(id, request);
    }

    @DELETE
    @Path("/{id}")
    @RequirePermission("core:department:manage")
    public Response delete(@PathParam("id") UUID id) {
        TenantPrincipal principal = authenticate();
        departmentService.softDelete(principal.tenantId(), id);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.DEPARTMENT_DELETED,
            "Department deleted successfully.",
            null)).build();
    }

    @GET
    @Path("/{id}/members")
    @RequirePermission("core:membership:read")
    public Response members(@PathParam("id") UUID id) {
        TenantPrincipal principal = authenticate();
        return Response.ok(ApiResponse.successList(
            OrganizationErrorCodes.MEMBERSHIP_LIST_SUCCESS,
            "Department members retrieved successfully.",
            departmentService.members(principal.tenantId(), id))).build();
    }

    private Response doUpdate(UUID id, DepartmentRequest request) {
        TenantPrincipal principal = authenticate();
        DepartmentNodeResponse data = departmentService.update(principal.tenantId(), id, request);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.DEPARTMENT_UPDATED,
            "Department updated successfully.",
            data)).build();
    }

    private Response doMove(UUID id, DepartmentMoveRequest request) {
        TenantPrincipal principal = authenticate();
        DepartmentNodeResponse data = departmentService.move(principal.tenantId(), id, request);
        return Response.ok(ApiResponse.success(
            OrganizationErrorCodes.DEPARTMENT_MOVED,
            "Department moved successfully.",
            data)).build();
    }

    private TenantPrincipal authenticate() {
        return securityResolver.requireTenantPrincipal(
            httpHeaders != null ? httpHeaders.getHeaderString(HttpHeaders.AUTHORIZATION) : null);
    }
}
