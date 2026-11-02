package com.vn9melody.openerp.modules.iam.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.security.JwtTokenService;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Internal lookup of ACTIVE tenant admins (Sprint 08, workflow ROLE assignment
 * resolution — ADR-S08-001 §3). A plugin service token for the tenant is
 * required; the list only contains user ids, never PII.
 */
@Path("/api/v1/internal/tenant-admins")
@Produces(MediaType.APPLICATION_JSON)
public class InternalTenantAdminsResource {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    EntityManager entityManager;

    @Inject
    com.vn9melody.openerp.modules.eventhub.service.InternalCallAuthService internalCallAuth;

    public record TenantAdmins(List<String> userIds) {}

    @GET
    public ApiResponse<TenantAdmins> list(@HeaderParam("X-Plugin-Service-Token") String token,
            @HeaderParam("X-Plugin-Fanout-Token") String fanoutToken,
            @HeaderParam("X-Tenant-Id") String tenantHeader) {
        UUID tenantId = authenticate(token, fanoutToken, tenantHeader);
        List<String> userIds = entityManager.createNativeQuery("""
                SELECT ur.user_id::text
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                JOIN users u ON u.id = ur.user_id
                WHERE ur.tenant_id = ?1
                  AND r.code = 'TENANT_ADMIN'
                  AND u.status = 'ACTIVE'
                """)
                .setParameter(1, tenantId)
                .getResultList()
                .stream()
                .map(String::valueOf)
                .toList();
        return ApiResponse.success("TENANT_ADMINS_SUCCESS",
                "Tenant admins retrieved.", new TenantAdmins(userIds));
    }

    private UUID authenticate(String token, String fanoutToken, String tenantHeader) {
        if (fanoutToken != null && !fanoutToken.isBlank()) {
            if (!internalCallAuth.fanoutTokenValid(fanoutToken)) {
                throw new ApiException(401, "UNAUTHORIZED", "Invalid fanout token");
            }
            if (tenantHeader == null || tenantHeader.isBlank()) {
                throw new ApiException(400, "TENANT_HEADER_REQUIRED",
                        "X-Tenant-Id is required with the fanout token");
            }
            return UUID.fromString(tenantHeader);
        }
        if (token == null || token.isBlank()) {
            throw new ApiException(401, "UNAUTHORIZED", "Service token is required");
        }
        try {
            JsonWebToken jwt = jwtTokenService.parseToken(token);
            if (!JwtTokenService.TYPE_PLUGIN_SERVICE.equals(jwt.getClaim("type"))) {
                throw new ApiException(401, "UNAUTHORIZED", "Invalid service token");
            }
            Object tenantId = jwt.getClaim("tenant_id");
            if (tenantId == null) {
                throw new ApiException(401, "UNAUTHORIZED", "Service token tenant is missing");
            }
            return UUID.fromString(tenantId.toString());
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, "UNAUTHORIZED", "Invalid service token");
        }
    }
}
