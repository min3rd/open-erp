package com.vn9melody.openerp.modules.iam.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.modules.iam.service.IamDataPolicyService;
import com.vn9melody.openerp.modules.iam.service.IamErrorCodes;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataPolicyInput;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataPolicyItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataPolicyMatrixUpdateRequest;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataPolicyUpdateRequest;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataResourceItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleDataPoliciesUpdateResponse;
import com.vn9melody.openerp.modules.iam.service.IamSecurityResolver;
import com.vn9melody.openerp.modules.iam.service.IamSecurityResolver.IamPrincipal;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Data-resource catalog and role × resource data-scope matrix (DES-02-API section 5.4, 5.7,
 * FEAT-15, TASK-282).
 *
 * <p>Note (design decision): per DES-02-API section 5.4 the data-policy matrix may be configured
 * for global system roles too — each tenant owns its own {@code role_data_policies} rows, so no
 * immutability restriction is applied here (unlike role rename/delete).</p>
 *
 * <p>TODO(wave-integration): attach {@code @RequirePermission("core:role:read" | "core:role:manage")}
 * annotations.</p>
 */
@Path("/api/v1/iam")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DataPolicyResource {

    @Inject
    IamSecurityResolver securityResolver;

    @Inject
    IamDataPolicyService dataPolicyService;

    @Context
    HttpHeaders httpHeaders;

    @GET
    @Path("/data-resources")
    public Response dataResources() {
        authenticate();
        List<DataResourceItem> items = dataPolicyService.listDataResources();
        return Response.ok(ApiResponse.successList(
            IamErrorCodes.DATA_RESOURCE_LIST_SUCCESS,
            "Data resource list retrieved successfully.",
            items)).build();
    }

    @GET
    @Path("/data-policies")
    public Response dataPolicies(@QueryParam("role_id") String roleId) {
        IamPrincipal principal = authenticate();
        UUID parsedRoleId = parseRoleId(roleId);
        List<DataPolicyItem> items = dataPolicyService.policies(principal.tenantId(), parsedRoleId);
        return Response.ok(ApiResponse.successList(
            IamErrorCodes.ROLE_DATA_POLICIES_SUCCESS,
            "Role data policies retrieved successfully.",
            items)).build();
    }

    @PUT
    @Path("/data-policies")
    public Response updateDataPolicies(@Valid DataPolicyMatrixUpdateRequest request) {
        IamPrincipal principal = authenticate();
        if (request == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "Request body is required");
        }
        if (request.items() != null && !request.items().isEmpty()) {
            RoleDataPoliciesUpdateResponse data = dataPolicyService.updatePoliciesMatrix(
                principal.tenantId(), request.items());
            return Response.ok(ApiResponse.success(
                IamErrorCodes.ROLE_DATA_POLICIES_UPDATED,
                "Role data policies updated successfully.",
                data)).build();
        }

        Map<UUID, List<DataPolicyInput>> grouped = new LinkedHashMap<>();
        if (request.policies() != null) {
            for (DataPolicyInput input : request.policies()) {
                UUID roleId = input.roleId() != null
                    ? parseRoleId(input.roleId())
                    : parseRoleId(request.roleId());
                grouped.computeIfAbsent(roleId, key -> new ArrayList<>()).add(input);
            }
        } else {
            grouped.computeIfAbsent(parseRoleId(request.roleId()), key -> new ArrayList<>());
        }

        int updated = 0;
        UUID firstRole = null;
        for (Map.Entry<UUID, List<DataPolicyInput>> entry : grouped.entrySet()) {
            if (firstRole == null) {
                firstRole = entry.getKey();
            }
            updated += dataPolicyService.updatePolicies(principal.tenantId(), entry.getKey(), entry.getValue())
                .updatedCount();
        }
        return Response.ok(ApiResponse.success(
            IamErrorCodes.ROLE_DATA_POLICIES_UPDATED,
            "Role data policies updated successfully.",
            new RoleDataPoliciesUpdateResponse(
                firstRole != null ? firstRole.toString() : null,
                updated))).build();
    }

    @GET
    @Path("/roles/{roleId}/data-policies")
    public Response roleDataPolicies(@PathParam("roleId") UUID roleId) {
        IamPrincipal principal = authenticate();
        List<DataPolicyItem> items = dataPolicyService.policies(principal.tenantId(), roleId);
        return Response.ok(ApiResponse.successList(
            IamErrorCodes.ROLE_DATA_POLICIES_SUCCESS,
            "Role data policies retrieved successfully.",
            items)).build();
    }

    @PUT
    @Path("/roles/{roleId}/data-policies")
    public Response updateRoleDataPolicies(@PathParam("roleId") UUID roleId,
                                           @Valid DataPolicyUpdateRequest request) {
        IamPrincipal principal = authenticate();
        RoleDataPoliciesUpdateResponse data = dataPolicyService.updatePolicies(
            principal.tenantId(), roleId, request != null ? request.policies() : null);
        return Response.ok(ApiResponse.success(
            IamErrorCodes.ROLE_DATA_POLICIES_UPDATED,
            "Role data policies updated successfully.",
            data)).build();
    }

    @GET
    @Path("/me/data-scopes")
    public Response myDataScopes() {
        IamPrincipal principal = authenticate();
        List<DataPolicyItem> items = dataPolicyService.effectivePoliciesForUser(
            principal.tenantId(), principal.userId());
        return Response.ok(ApiResponse.successList(
            IamErrorCodes.ME_DATA_SCOPES_SUCCESS,
            "Effective data scopes retrieved successfully.",
            items)).build();
    }

    private UUID parseRoleId(String roleId) {
        if (roleId == null || roleId.isBlank()) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "role_id is required");
        }
        try {
            return UUID.fromString(roleId.trim());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, "VALIDATION_INVALID_FORMAT", "Invalid role_id value");
        }
    }

    private IamPrincipal authenticate() {
        return securityResolver.requireTenantPrincipal(
            httpHeaders != null ? httpHeaders.getHeaderString(HttpHeaders.AUTHORIZATION) : null);
    }
}
