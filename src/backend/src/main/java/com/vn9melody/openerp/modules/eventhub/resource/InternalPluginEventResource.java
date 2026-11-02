package com.vn9melody.openerp.modules.eventhub.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.eventhub.service.PluginEventHubService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Internal publish endpoint of the Plugin Event Hub (ADR-S08-002 §2.1).
 * The caller authenticates with its own plugin service token; the source
 * plugin is taken from the token, never from the body.
 */
@Path("/api/v1/internal/plugin-events")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InternalPluginEventResource {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    PluginEventHubService hubService;

    @Inject
    com.vn9melody.openerp.modules.eventhub.service.InternalCallAuthService callAuth;

    public record PublishEventRequest(
            String event,
            String entity,
            @com.fasterxml.jackson.annotation.JsonProperty("aggregate_id") String aggregateId,
            Object payload,
            @com.fasterxml.jackson.annotation.JsonProperty("idempotency_key") String idempotencyKey) {}

    public record PublishResult(
            @com.fasterxml.jackson.annotation.JsonProperty("event_id") UUID eventId,
            boolean created) {}

    @POST
    @jakarta.transaction.Transactional
    public ApiResponse<PublishResult> publish(@HeaderParam("X-Plugin-Service-Token") String token,
            @HeaderParam("X-Plugin-Fanout-Token") String fanoutToken,
            @HeaderParam("X-Plugin-Key") String pluginKeyHeader,
            @HeaderParam("X-Tenant-Id") String tenantHeader,
            PublishEventRequest request) {
        UUID tenantId = authenticate(token, fanoutToken, tenantHeader);
        String sourcePlugin = sourcePluginOf(token, pluginKeyHeader);
        if (request == null || request.event() == null || request.event().isBlank()) {
            throw new ApiException(400, "EVENT_TYPE_REQUIRED", "event is required");
        }
        if (request.idempotencyKey() == null || request.idempotencyKey().isBlank()) {
            throw new ApiException(400, "EVENT_IDEMPOTENCY_KEY_REQUIRED",
                    "idempotency_key is required");
        }
        PluginEventHubService.PublishResult result = hubService.publish(
                tenantId,
                sourcePlugin,
                request.event(),
                request.entity(),
                request.aggregateId(),
                request.payload(),
                request.idempotencyKey());
        return ApiResponse.success("PLUGIN_EVENT_PUBLISHED",
                result.created() ? "Event published." : "Event already published (idempotent).",
                new PublishResult(result.eventId(), result.created()));
    }

    private String sourcePluginOf(String token, String pluginKeyHeader) {
        if (pluginKeyHeader != null && !pluginKeyHeader.isBlank()) {
            return pluginKeyHeader;
        }
        if (token == null || token.isBlank()) {
            return "unknown";
        }
        try {
            JsonWebToken jwt = jwtTokenService.parseToken(token);
            Object pluginKey = jwt.getClaim("plugin_key");
            return pluginKey == null ? "unknown" : pluginKey.toString();
        } catch (Exception e) {
            return "unknown";
        }
    }

    private UUID authenticate(String token, String fanoutToken, String tenantHeader) {
        // Shared fanout identity: tenant comes from the X-Tenant-Id header the
        // plugin copies from its own TenantContext.
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
        JsonWebToken jwt = parseServiceToken(token);
        Object pluginKey = jwt.getClaim("plugin_key");
        Object tenantId = jwt.getClaim("tenant_id");
        if (tenantId == null) {
            throw new ApiException(401, "UNAUTHORIZED", "Service token tenant is missing");
        }
        return UUID.fromString(tenantId.toString());
    }

    private JsonWebToken parseServiceToken(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(401, "UNAUTHORIZED", "Service token is required");
        }
        try {
            JsonWebToken jwt = jwtTokenService.parseToken(token);
            if (!JwtTokenService.TYPE_PLUGIN_SERVICE.equals(jwt.getClaim("type"))) {
                throw new ApiException(401, "UNAUTHORIZED", "Invalid service token");
            }
            return jwt;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, "UNAUTHORIZED", "Invalid service token");
        }
    }
}
