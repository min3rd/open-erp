package com.vn9melody.openerp.modules.eventhub.resource;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Internal listing of tenants that have a plugin ACTIVE (ADR-S08-001 SLA
 * scheduler input). Only reachable with a plugin service token for the same
 * plugin key.
 */
@Path("/api/v1/internal/tenants")
@Produces(MediaType.APPLICATION_JSON)
public class InternalPluginTenantsResource {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @GET
    public ApiResponse<ListData> list(@HeaderParam("X-Plugin-Service-Token") String token,
            @QueryParam("plugin") String pluginKey) {
        if (token == null || token.isBlank()) {
            throw new ApiException(401, "UNAUTHORIZED", "Service token is required");
        }
        try {
            JsonWebToken jwt = jwtTokenService.parseToken(token);
            if (!JwtTokenService.TYPE_PLUGIN_SERVICE.equals(jwt.getClaim("type"))) {
                throw new ApiException(401, "UNAUTHORIZED", "Invalid service token");
            }
            Object tokenPlugin = jwt.getClaim("plugin_key");
            if (pluginKey == null || pluginKey.isBlank() || tokenPlugin == null
                    || !pluginKey.equals(tokenPlugin.toString())) {
                throw new ApiException(403, "TENANT_LIST_PLUGIN_MISMATCH",
                        "Service token does not allow listing this plugin's tenants");
            }
            List<String> tenantIds = tenantPluginRepository
                    .list("pluginKey = ?1 and status = 'ACTIVE'", pluginKey)
                    .stream()
                    .map(ledger -> ledger.tenantId.toString())
                    .toList();
            return ApiResponse.success("TENANT_LIST_SUCCESS",
                    "Active tenants retrieved.",
                    new ListData(tenantIds));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, "UNAUTHORIZED", "Invalid service token");
        }
    }

    public record ListData(List<String> items) {}
}
