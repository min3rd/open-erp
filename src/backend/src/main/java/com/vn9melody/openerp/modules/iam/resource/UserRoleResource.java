package com.vn9melody.openerp.modules.iam.resource;

import com.vn9melody.openerp.core.security.RequirePermission;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.iam.service.IamErrorCodes;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.UserDirectoryItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.UserRoleAssignRequest;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.UserRoleItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.UserRolesAssignedResponse;
import com.vn9melody.openerp.modules.iam.service.IamRoleService;
import com.vn9melody.openerp.modules.iam.service.IamSecurityResolver;
import com.vn9melody.openerp.modules.iam.service.IamSecurityResolver.IamPrincipal;
import com.vn9melody.openerp.modules.iam.service.IamUserDirectoryService;
import com.vn9melody.openerp.modules.iam.service.IamUserDirectoryService.UserDirectoryPage;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
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
 * User ↔ role assignment lifecycle + tenant user directory (DES-02-API section 5.5-5.6,
 * TASK-278).
 *
 * <p>Every endpoint declares its functional permission via {@code @RequirePermission}
 * and is enforced by {@code PermissionEnforcementFilter} (TASK-267).</p>
 */
@Path("/api/v1/iam")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserRoleResource {

    @Inject
    IamSecurityResolver securityResolver;

    @Inject
    IamRoleService roleService;

    @Inject
    IamUserDirectoryService userDirectoryService;

    @Context
    HttpHeaders httpHeaders;

    @GET
    @Path("/users")
    @RequirePermission("core:user:read")
    public Response users(@QueryParam("page") @DefaultValue("0") int page,
                          @QueryParam("size") @DefaultValue("20") int size,
                          @QueryParam("keyword") String keyword,
                          @QueryParam("status") String status) {
        IamPrincipal principal = authenticate();
        UserDirectoryPage result = userDirectoryService.listUsers(
            principal.tenantId(), keyword, status, page, size);
        return Response.ok(ApiResponse.successPaged(
            IamErrorCodes.USER_LIST_SUCCESS,
            "User list retrieved successfully.",
            result.items(), result.page(), result.size(), result.totalItems())).build();
    }

    @GET
    @Path("/users/{userId}/roles")
    @RequirePermission("core:user:read")
    public Response userRoles(@PathParam("userId") UUID userId) {
        IamPrincipal principal = authenticate();
        List<UserRoleItem> items = roleService.userRoles(principal.tenantId(), userId);
        return Response.ok(ApiResponse.successList(
            IamErrorCodes.USER_ROLE_LIST_SUCCESS,
            "User roles retrieved successfully.",
            items)).build();
    }

    @POST
    @Path("/users/{userId}/roles")
    @RequirePermission("core:role:manage")
    public Response assignUserRoles(@PathParam("userId") UUID userId, @Valid UserRoleAssignRequest request) {
        IamPrincipal principal = authenticate();
        UserRolesAssignedResponse data = roleService.assignRolesToUser(
            principal.tenantId(), userId, request != null ? request.roleIds() : null, principal.userId());
        return Response.ok(ApiResponse.success(
            IamErrorCodes.USER_ROLES_ASSIGNED,
            "User roles assigned successfully.",
            data)).build();
    }

    @DELETE
    @Path("/users/{userId}/roles/{roleId}")
    @RequirePermission("core:role:manage")
    public Response removeUserRole(@PathParam("userId") UUID userId, @PathParam("roleId") UUID roleId) {
        IamPrincipal principal = authenticate();
        roleService.removeUserFromRole(principal.tenantId(), roleId, userId);
        return Response.ok(ApiResponse.success(
            IamErrorCodes.USER_ROLE_REMOVED,
            "User role removed successfully.",
            null)).build();
    }

    private IamPrincipal authenticate() {
        return securityResolver.requireTenantPrincipal(
            httpHeaders != null ? httpHeaders.getHeaderString(HttpHeaders.AUTHORIZATION) : null);
    }
}
