package com.vn9melody.openerp.modules.iam.resource;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.security.JwtTokenService;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * TASK-431: tenant-governance check used by the employee plugin before an
 * offboarding is allowed. Called with a plugin service token; never exposed to
 * end users. The employee plugin cannot read Core IAM tables, so this is the
 * only place that knows whether the linked user is the last owner/admin or a
 * platform admin.
 */
@Path("/api/v1/internal/employees")
@Produces(MediaType.APPLICATION_JSON)
public class InternalEmployeeGovernanceResource {

    @Inject
    EntityManager entityManager;

    @Inject
    JwtTokenService jwtTokenService;

    public record OffboardingCheck(
        @JsonProperty("last_owner") boolean lastOwner,
        @JsonProperty("last_admin") boolean lastAdmin,
        @JsonProperty("platform_role") boolean platformRole,
        @JsonProperty("owner_count") long ownerCount,
        @JsonProperty("admin_count") long adminCount,
        @JsonProperty("platform_roles") List<String> platformRoles
    ) {
    }

    @GET
    @Path("/{userId}/offboarding-check")
    public ApiResponse<OffboardingCheck> check(
            @HeaderParam("X-Plugin-Service-Token") String token,
            @PathParam("userId") UUID userId) {
        UUID tenantId = authenticate(token);
        List<?> roleRows = entityManager.createNativeQuery(
                "select role from user_tenants where user_id = ?1 and tenant_id = ?2")
            .setParameter(1, userId)
            .setParameter(2, tenantId)
            .getResultList();
        String role = roleRows.isEmpty() ? null : String.valueOf(roleRows.get(0));
        if (role == null) {
            throw new ApiException(404, "TENANT_USER_NOT_FOUND",
                "User does not belong to the token tenant", java.util.Map.of("user_id", userId.toString()));
        }
        long ownerCount = count(
            "select count(distinct user_id) from ("
                + " select user_id from user_tenants where tenant_id = ?1 and role = 'OWNER'"
                + " union"
                + " select ur.user_id from user_roles ur join roles r on r.id = ur.role_id"
                + " where ur.tenant_id = ?1 and r.code = 'TENANT_OWNER') x",
            tenantId);
        long adminCount = count(
            "select count(distinct user_id) from ("
                + " select user_id from user_tenants where tenant_id = ?1 and role in ('ADMIN', 'TENANT_ADMIN')"
                + " union"
                + " select ur.user_id from user_roles ur join roles r on r.id = ur.role_id"
                + " where ur.tenant_id = ?1 and r.code = 'TENANT_ADMIN') x",
            tenantId);
        @SuppressWarnings("unchecked")
        List<String> platformRoles = entityManager.createNativeQuery(
                "select role from platform_super_admins where user_id = ?1 "
                    + "and status in ('ACTIVE', 'INVITED')")
            .setParameter(1, userId)
            .getResultList();
        boolean lastOwner = "OWNER".equals(role) && ownerCount <= 1;
        boolean lastAdmin = ("ADMIN".equals(role) || "TENANT_ADMIN".equals(role)) && adminCount <= 1;
        return ApiResponse.success("CORE_OFFBOARDING_CHECK_SUCCESS",
            "Offboarding governance check completed.",
            new OffboardingCheck(lastOwner, lastAdmin, !platformRoles.isEmpty(),
                ownerCount, adminCount, platformRoles));
    }

    private long count(String sql, UUID tenantId) {
        return ((Number) entityManager.createNativeQuery(sql)
            .setParameter(1, tenantId)
            .getSingleResult()).longValue();
    }

    private UUID authenticate(String token) {
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
            if (tokenTenant == null) {
                throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Service token tenant is missing");
            }
            return UUID.fromString(tokenTenant);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, ErrorCode.UNAUTHORIZED, "Invalid service token");
        }
    }
}
