package com.vn9melody.openerp.core.context;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.JwtTokenService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Internal-only projection API. Called by the organization/employee plugins
 * with a short-lived plugin service token; never exposed to end users.
 */
@Path("/api/v1/internal")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ScopeProjectionResource {

    @Inject
    ScopeProjectionService service;

    @Inject
    JwtTokenService jwtTokenService;

    public record ProjectionRequest(
        @JsonProperty("primary_branch_id") UUID primaryBranchId,
        @JsonProperty("primary_department_id") UUID primaryDepartmentId,
        @JsonProperty("member_branch_ids") Set<UUID> memberBranchIds,
        @JsonProperty("managed_branch_ids") Set<UUID> managedBranchIds,
        @JsonProperty("department_ids") Set<UUID> departmentIds,
        @JsonProperty("version") Long version
    ) {
    }

    public record ClosureEdge(
        @JsonProperty("ancestor_id") UUID ancestorId,
        @JsonProperty("descendant_id") UUID descendantId,
        @JsonProperty("depth") Integer depth
    ) {
    }

    public record ClosureRequest(
        @JsonProperty("edges") List<ClosureEdge> edges
    ) {
    }

    @PUT
    @Path("/scope-projections/{tenantId}/{userId}")
    public ApiResponse<ProjectionRequest> upsert(
            @HeaderParam("X-Plugin-Service-Token") String token,
            @PathParam("tenantId") UUID tenantId,
            @PathParam("userId") UUID userId,
            ProjectionRequest request) {
        authenticate(token, tenantId);
        if (request == null) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "Request body is required");
        }
        service.upsert(tenantId, userId, new ScopeProjectionService.Projection(
            request.primaryBranchId(),
            request.primaryDepartmentId(),
            request.memberBranchIds() == null ? Set.of() : request.memberBranchIds(),
            request.managedBranchIds() == null ? Set.of() : request.managedBranchIds(),
            request.departmentIds() == null ? Set.of() : request.departmentIds()
        ), request.version() == null ? 0 : request.version());
        return ApiResponse.success(
            "CORE_SCOPE_PROJECTION_UPSERTED",
            "Scope projection upserted.",
            request);
    }

    @DELETE
    @Path("/scope-projections/{tenantId}/{userId}")
    public ApiResponse<Void> delete(
            @HeaderParam("X-Plugin-Service-Token") String token,
            @PathParam("tenantId") UUID tenantId,
            @PathParam("userId") UUID userId) {
        authenticate(token, tenantId);
        service.delete(tenantId, userId);
        return ApiResponse.success(
            "CORE_SCOPE_PROJECTION_DELETED",
            "Scope projection deleted.",
            null);
    }

    @PUT
    @Path("/department-closure/{tenantId}")
    public ApiResponse<Void> closure(
            @HeaderParam("X-Plugin-Service-Token") String token,
            @PathParam("tenantId") UUID tenantId,
            ClosureRequest request) {
        authenticate(token, tenantId);
        List<Object[]> edges = new ArrayList<>();
        if (request != null && request.edges() != null) {
            for (ClosureEdge edge : request.edges()) {
                if (edge.ancestorId() != null && edge.descendantId() != null) {
                    edges.add(new Object[]{edge.ancestorId(), edge.descendantId(),
                        edge.depth() == null ? 0 : edge.depth()});
                }
            }
        }
        service.replaceClosure(tenantId, edges);
        return ApiResponse.success(
            "CORE_DEPARTMENT_CLOSURE_UPDATED",
            "Department closure updated.",
            null);
    }

    @POST
    @Path("/scope-projections/{tenantId}/rebuild")
    public ApiResponse<Void> rebuild(
            @HeaderParam("X-Plugin-Service-Token") String token,
            @PathParam("tenantId") UUID tenantId) {
        authenticate(token, tenantId);
        service.rebuildFromLegacy(tenantId);
        return ApiResponse.success(
            "CORE_SCOPE_PROJECTION_REBUILT",
            "Scope projection rebuilt from legacy organization.",
            null);
    }

    private void authenticate(String token, UUID tenantId) {
        if (token == null || token.isBlank()) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Service token is required");
        }
        try {
            JsonWebToken jwt = jwtTokenService.parseToken(token);
            String type = jwt.getClaim("type");
            String tokenTenant = jwt.getClaim("tenant_id");
            if (!JwtTokenService.TYPE_PLUGIN_SERVICE.equals(type)) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid service token");
            }
            if (tokenTenant == null || !tokenTenant.equals(tenantId.toString())) {
                throw new ApiException(403, ErrorCode.FORBIDDEN, "Service token tenant mismatch");
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid service token");
        }
    }
}
