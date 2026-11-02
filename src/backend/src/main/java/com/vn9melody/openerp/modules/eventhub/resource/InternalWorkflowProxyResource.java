package com.vn9melody.openerp.modules.eventhub.resource;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiResponse;
import com.vn9melody.openerp.core.security.JwtTokenService;
import com.vn9melody.openerp.modules.eventhub.service.InternalCallAuthService;
import com.vn9melody.openerp.modules.plugin.service.PluginRuntimeGatewayService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Internal workflow API for plugins (ADR-S08-004 §2.2): the employee plugin
 * opens change-request instances and proxies approval actions through these
 * endpoints; Core forwards to the workflow plugin with a short-lived service
 * identity. Auth: fanout shared token or plugin service JWT.
 */
@Path("/api/v1/internal/workflow")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InternalWorkflowProxyResource {

    @Inject
    InternalCallAuthService callAuth;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    PluginRuntimeGatewayService gatewayService;

    @Inject
    ObjectMapper objectMapper;

    public record OpenInstanceRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("definition_key") String definitionKey,
            Map<String, Object> context,
            @com.fasterxml.jackson.annotation.JsonProperty("idempotency_key") String idempotencyKey,
            @com.fasterxml.jackson.annotation.JsonProperty("source_ref") Map<String, Object> sourceRef,
            @com.fasterxml.jackson.annotation.JsonProperty("initiated_by") UUID initiatedBy) {}

    public record TaskActionRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("actor_user_id") UUID actorUserId,
            String action, String comment,
            @com.fasterxml.jackson.annotation.JsonProperty("target_step_node_id") String targetStepNodeId,
            @com.fasterxml.jackson.annotation.JsonProperty("target_user_id") UUID targetUserId) {}

    @POST
    @Path("/instances")
    public ApiResponse<Object> openInstance(
            @HeaderParam("X-Plugin-Fanout-Token") String fanoutToken,
            @HeaderParam("X-Tenant-Id") String tenantHeader,
            @HeaderParam("X-Plugin-Service-Token") String serviceToken,
            OpenInstanceRequest request) {
        UUID tenantId = requireTenant(fanoutToken, tenantHeader, serviceToken);
        return forward(tenantId, "POST", "/api/v1/workflow/internal/instances", request);
    }

    @GET
    @Path("/instances/{id}")
    public ApiResponse<Object> progress(
            @HeaderParam("X-Plugin-Fanout-Token") String fanoutToken,
            @HeaderParam("X-Tenant-Id") String tenantHeader,
            @HeaderParam("X-Plugin-Service-Token") String serviceToken,
            @PathParam("id") UUID id) {
        UUID tenantId = requireTenant(fanoutToken, tenantHeader, serviceToken);
        return forward(tenantId, "GET", "/api/v1/workflow/internal/instances/" + id, null);
    }

    @POST
    @Path("/tasks/{id}/actions")
    public ApiResponse<Object> taskAction(
            @HeaderParam("X-Plugin-Fanout-Token") String fanoutToken,
            @HeaderParam("X-Tenant-Id") String tenantHeader,
            @HeaderParam("X-Plugin-Service-Token") String serviceToken,
            @PathParam("id") UUID id, TaskActionRequest request) {
        UUID tenantId = requireTenant(fanoutToken, tenantHeader, serviceToken);
        return forward(tenantId, "POST", "/api/v1/workflow/internal/tasks/" + id + "/actions",
                request);
    }

    private UUID requireTenant(String fanoutToken, String tenantHeader, String serviceToken) {
        if (callAuth.fanoutTokenValid(fanoutToken)) {
            if (tenantHeader == null || tenantHeader.isBlank()) {
                throw new ApiException(400, "TENANT_HEADER_REQUIRED",
                        "X-Tenant-Id is required with the fanout token");
            }
            return UUID.fromString(tenantHeader);
        }
        // Service JWT path: the token itself carries the tenant claim.
        if (serviceToken != null && !serviceToken.isBlank()) {
            try {
                var jwt = jwtTokenService.parseToken(serviceToken);
                if (com.vn9melody.openerp.core.security.JwtTokenService.TYPE_PLUGIN_SERVICE
                        .equals(jwt.getClaim("type"))) {
                    Object tenantId = jwt.getClaim("tenant_id");
                    if (tenantId != null) {
                        return UUID.fromString(tenantId.toString());
                    }
                }
            } catch (ApiException e) {
                throw e;
            } catch (Exception ignored) {
                // fall through to uniform rejection
            }
        }
        throw callAuth.unauthorized();
    }

    private ApiResponse<Object> forward(UUID tenantId, String method, String path, Object body) {
        try {
            byte[] payload = body == null ? new byte[0]
                    : objectMapper.writeValueAsBytes(body);
            PluginRuntimeGatewayService.GatewayResponse response = gatewayService.forward(
                    tenantId, null, Set.of(), Set.of(), Set.of(),
                    "workflow", null, method, path, null, "application/json", payload);
            if (response.status() < 200 || response.status() >= 300) {
                String detail = new String(response.body() == null
                        ? new byte[0] : response.body());
                throw new ApiException(502, "WORKFLOW_PROXY_FAILED",
                        "Workflow engine rejected the call (HTTP " + response.status() + "): "
                                + detail.substring(0, Math.min(detail.length(), 400)));
            }
            JsonNode parsed = objectMapper.readTree(response.body());
            return ApiResponse.success("WORKFLOW_PROXY_SUCCESS", "Forwarded.",
                    objectMapper.convertValue(parsed.path("data"), Object.class));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(502, "WORKFLOW_PROXY_FAILED",
                    "Workflow engine is unavailable");
        }
    }
}
