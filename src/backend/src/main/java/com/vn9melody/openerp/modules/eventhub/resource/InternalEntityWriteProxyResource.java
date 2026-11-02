package com.vn9melody.openerp.modules.eventhub.resource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.registry.EntityRegistryService;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.plugin.service.PluginRuntimeGatewayService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Entity Write Proxy (ADR-S08-002 §2.2): a plugin writes a record into an
 * entity owned by another plugin through Core. Core validates the target is
 * registered in the Entity Registry with TENANT storage, then forwards with a
 * short-lived service identity; the owning plugin validates its own schema.
 */
@Path("/api/v1/internal/entity-write")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InternalEntityWriteProxyResource {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    com.vn9melody.openerp.modules.eventhub.service.InternalCallAuthService callAuth;

    @Inject
    com.vn9melody.openerp.core.registry.EntityRegistryService entityRegistryService;

    @Inject
    PluginRuntimeGatewayService gatewayService;

    @Inject
    ObjectMapper objectMapper;

    public record EntityWriteRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("entity_name") String entityName,
            Map<String, Object> record,
            @com.fasterxml.jackson.annotation.JsonProperty("idempotency_key") String idempotencyKey) {}

    @POST
    @Path("/{pluginId}")
    public ApiResponse<Object> write(@HeaderParam("X-Plugin-Service-Token") String token,
            @HeaderParam("X-Plugin-Fanout-Token") String fanoutToken,
            @HeaderParam("X-Tenant-Id") String tenantHeader,
            @PathParam("pluginId") String pluginId, EntityWriteRequest request) {
        UUID tenantId = authenticate(token, fanoutToken, tenantHeader);
        if (request == null || request.entityName() == null || request.entityName().isBlank()) {
            throw new ApiException(400, "ENTITY_NAME_REQUIRED", "entity_name is required");
        }
        if (request.record() == null || request.record().isEmpty()) {
            throw new ApiException(400, "ENTITY_RECORD_REQUIRED", "record is required");
        }
        if (request.idempotencyKey() == null || request.idempotencyKey().isBlank()) {
            throw new ApiException(400, "ENTITY_WRITE_IDEMPOTENCY_KEY_REQUIRED",
                    "idempotency_key is required");
        }
        EntityRegistryService.Lookup lookup = entityRegistryService
                .lookup("plugin:" + pluginId + "." + request.entityName())
                .orElseThrow(() -> new ApiException(404, "PLUGIN_ENTITY_TARGET_NOT_FOUND",
                        "Entity is not registered: " + pluginId + "." + request.entityName()));
        if (!"TENANT".equalsIgnoreCase(lookup.storageType())) {
            throw new ApiException(400, "ENTITY_TARGET_NOT_TENANT_SCOPED",
                    "Cross-plugin writes are only allowed for TENANT-scoped entities");
        }
        try {
            byte[] body = objectMapper.writeValueAsBytes(Map.of(
                    "entity_name", request.entityName(),
                    "record", request.record(),
                    "idempotency_key", request.idempotencyKey()));
            PluginRuntimeGatewayService.GatewayResponse response = gatewayService.forward(
                    tenantId, null, Set.of(), Set.of(), Set.of(),
                    pluginId, null, "POST", "/api/v1/internal/entity-write", null,
                    "application/json", body);
            if (response.status() < 200 || response.status() >= 300) {
                throw new ApiException(502, "ENTITY_WRITE_TARGET_FAILED",
                        "Target plugin rejected the write (HTTP " + response.status() + ")");
            }
            JsonNode parsed = objectMapper.readTree(response.body());
            return ApiResponse.success("ENTITY_WRITE_PROXY_SUCCESS",
                    "Entity write forwarded.",
                    objectMapper.convertValue(parsed, Object.class));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(502, "ENTITY_WRITE_TARGET_FAILED",
                    "Target plugin is unavailable");
        }
    }

    private UUID authenticate(String token, String fanoutToken, String tenantHeader) {
        if (fanoutToken != null && !fanoutToken.isBlank()) {
            if (!callAuth.fanoutTokenValid(fanoutToken)) {
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
