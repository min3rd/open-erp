package com.vn9melody.openerp.modules.iam.resource;

import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.iam.service.IamErrorCodes;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.PermissionItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RolePermissionUpdateRequest;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RolePermissionsUpdateResponse;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleRequest;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleUserAssignRequest;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleUserItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleUsersAssignedResponse;
import com.vn9melody.openerp.modules.iam.service.IamRoleService;
import com.vn9melody.openerp.modules.iam.service.IamRoleService.RoleListPage;
import com.vn9melody.openerp.modules.iam.service.IamSecurityResolver;
import com.vn9melody.openerp.modules.iam.service.IamSecurityResolver.IamPrincipal;
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
 * Functional RBAC APIs: permission catalog, tenant roles, role permissions and role members
 * (DES-02-API section 5.1-5.3, FEAT-14, TASK-278).
 *
 * <p>TODO(wave-integration): attach {@code @RequirePermission("core:permission:read")} /
 * {@code @RequirePermission("core:role:read" | "core:role:manage")} annotations.</p>
 */
@Path("/api/v1/iam")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RoleResource {

    @Inject
    IamSecurityResolver securityResolver;

    @Inject
    IamRoleService roleService;

    @Context
    HttpHeaders httpHeaders;

    @GET
    @Path("/permissions")
    public Response permissions() {
        authenticate();
        List<PermissionItem> items = roleService.listPermissions();
        return Response.ok(ApiResponse.successList(
            IamErrorCodes.PERMISSION_LIST_SUCCESS,
            "Permission list retrieved successfully.",
            items)).build();
    }

    @GET
    @Path("/roles")
    public Response roles(@QueryParam("page") @DefaultValue("0") int page,
                          @QueryParam("size") @DefaultValue("20") int size,
                          @QueryParam("keyword") String keyword) {
        IamPrincipal principal = authenticate();
        RoleListPage result = roleService.listRoles(principal.tenantId(), page, size, keyword);
        return Response.ok(ApiResponse.successPaged(
            IamErrorCodes.ROLE_LIST_SUCCESS,
            "Role list retrieved successfully.",
            result.items(), result.page(), result.size(), result.totalItems())).build();
    }

    @POST
    @Path("/roles")
    public Response createRole(@Valid RoleRequest request) {
        IamPrincipal principal = authenticate();
        RoleItem data = roleService.createRole(principal.tenantId(), request);
        return Response.status(Response.Status.CREATED).entity(ApiResponse.success(
            IamErrorCodes.ROLE_CREATED,
            "Role created successfully.",
            data)).build();
    }

    @GET
    @Path("/roles/{id}")
    public Response roleDetail(@PathParam("id") UUID id) {
        IamPrincipal principal = authenticate();
        return Response.ok(ApiResponse.success(
            IamErrorCodes.ROLE_LIST_SUCCESS,
            "Role retrieved successfully.",
            roleService.roleDetail(principal.tenantId(), id))).build();
    }

    @PATCH
    @Path("/roles/{id}")
    public Response patchRole(@PathParam("id") UUID id, @Valid RoleRequest request) {
        return doUpdateRole(id, request);
    }

    @PUT
    @Path("/roles/{id}")
    public Response putRole(@PathParam("id") UUID id, @Valid RoleRequest request) {
        return doUpdateRole(id, request);
    }

    @DELETE
    @Path("/roles/{id}")
    public Response deleteRole(@PathParam("id") UUID id) {
        IamPrincipal principal = authenticate();
        roleService.deleteRole(principal.tenantId(), id);
        return Response.ok(ApiResponse.success(
            IamErrorCodes.ROLE_DELETED,
            "Role deleted successfully.",
            null)).build();
    }

    @GET
    @Path("/roles/{id}/permissions")
    public Response rolePermissions(@PathParam("id") UUID id) {
        IamPrincipal principal = authenticate();
        return Response.ok(ApiResponse.successList(
            IamErrorCodes.PERMISSION_LIST_SUCCESS,
            "Role permissions retrieved successfully.",
            roleService.rolePermissions(principal.tenantId(), id))).build();
    }

    @PUT
    @Path("/roles/{id}/permissions")
    public Response updateRolePermissions(@PathParam("id") UUID id, @Valid RolePermissionUpdateRequest request) {
        IamPrincipal principal = authenticate();
        RolePermissionsUpdateResponse data = roleService.updateRolePermissions(
            principal.tenantId(), id, request != null ? request.permissionIds() : null);
        return Response.ok(ApiResponse.success(
            IamErrorCodes.ROLE_PERMISSIONS_UPDATED,
            "Role permissions updated successfully.",
            data)).build();
    }

    @GET
    @Path("/roles/{id}/users")
    public Response roleUsers(@PathParam("id") UUID id) {
        IamPrincipal principal = authenticate();
        List<RoleUserItem> items = roleService.roleUsers(principal.tenantId(), id);
        return Response.ok(ApiResponse.successList(
            IamErrorCodes.USER_ROLE_LIST_SUCCESS,
            "Role users retrieved successfully.",
            items)).build();
    }

    @POST
    @Path("/roles/{id}/users")
    public Response assignUsers(@PathParam("id") UUID id, @Valid RoleUserAssignRequest request) {
        IamPrincipal principal = authenticate();
        RoleUsersAssignedResponse data = roleService.assignUsersToRole(
            principal.tenantId(), id, request != null ? request.userIds() : null, principal.userId());
        return Response.ok(ApiResponse.success(
            IamErrorCodes.USER_ROLES_ASSIGNED,
            "Users assigned to role successfully.",
            data)).build();
    }

    @DELETE
    @Path("/roles/{id}/users/{userId}")
    public Response removeUser(@PathParam("id") UUID id, @PathParam("userId") UUID userId) {
        IamPrincipal principal = authenticate();
        roleService.removeUserFromRole(principal.tenantId(), id, userId);
        return Response.ok(ApiResponse.success(
            IamErrorCodes.USER_ROLE_REMOVED,
            "Role removed from user successfully.",
            null)).build();
    }

    private Response doUpdateRole(UUID id, RoleRequest request) {
        IamPrincipal principal = authenticate();
        RoleItem data = roleService.updateRole(principal.tenantId(), id, request);
        return Response.ok(ApiResponse.success(
            IamErrorCodes.ROLE_UPDATED,
            "Role updated successfully.",
            data)).build();
    }

    private IamPrincipal authenticate() {
        return securityResolver.requireTenantPrincipal(
            httpHeaders != null ? httpHeaders.getHeaderString(HttpHeaders.AUTHORIZATION) : null);
    }
}
