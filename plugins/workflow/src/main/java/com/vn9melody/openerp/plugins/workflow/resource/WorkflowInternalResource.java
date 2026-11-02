package com.vn9melody.openerp.plugins.workflow.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugins.workflow.api.WorkflowErrorCode;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowDefinition;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowInstance;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowTask;
import com.vn9melody.openerp.plugins.workflow.service.WorkflowEngineService;
import com.vn9melody.openerp.plugins.workflow.service.WorkflowTriggerService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Internal surface of the workflow engine (only reachable through the Core
 * runtime gateway with a service identity): Event Hub deliveries, plugin-opened
 * instances (employee migration ADR-S08-004), task actions, the Core-driven
 * SLA scan, and the tenant bootstrap seed.
 */
@Path("/api/v1/workflow/internal")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorkflowInternalResource {

    public static final String EMPLOYEE_PROFILE_CHANGE_KEY = "employee-profile-change";

    @Inject
    WorkflowEngineService engineService;

    @Inject
    WorkflowTriggerService triggerService;

    @Inject
    PluginDataClient client;

    // ---- Event Hub delivery (ADR-S08-002 §2.1) -----------------------

    public record EventDelivery(
            @com.fasterxml.jackson.annotation.JsonProperty("event_delivery_id") String eventDeliveryId,
            String event,
            @com.fasterxml.jackson.annotation.JsonProperty("source_plugin") String sourcePlugin,
            String entity,
            @com.fasterxml.jackson.annotation.JsonProperty("aggregate_id") String aggregateId,
            Map<String, Object> payload) {}

    @POST
    @Path("/events")
    public ApiResponse<Map<String, Object>> receiveEvent(EventDelivery delivery) {
        if (delivery == null || delivery.eventDeliveryId() == null
                || delivery.eventDeliveryId().isBlank()) {
            throw new ApiException(400, "EVENT_DELIVERY_ID_REQUIRED",
                    "event_delivery_id is required");
        }
        int opened = triggerService.handle(delivery.eventDeliveryId(), delivery.event(),
                delivery.sourcePlugin(), delivery.entity(), delivery.aggregateId(),
                delivery.payload());
        return ApiResponse.success("WORKFLOW_EVENT_ACCEPTED",
                "Event accepted; " + opened + " instance(s) opened.",
                Map.of("instances_opened", opened));
    }

    // ---- Plugin API (employee migration, ADR-S08-004 §2.2) -----------

    public record OpenInstanceRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("definition_key") String definitionKey,
            Map<String, Object> context,
            @com.fasterxml.jackson.annotation.JsonProperty("idempotency_key") String idempotencyKey,
            @com.fasterxml.jackson.annotation.JsonProperty("source_ref") Map<String, Object> sourceRef,
            @com.fasterxml.jackson.annotation.JsonProperty("initiated_by") UUID initiatedBy) {}

    @POST
    @Path("/instances")
    public ApiResponse<WorkflowInstance> openInstance(OpenInstanceRequest request) {
        if (request == null || request.definitionKey() == null || request.definitionKey().isBlank()) {
            throw new ApiException(400, "WORKFLOW_DEFINITION_KEY_REQUIRED",
                    "definition_key is required");
        }
        Map<String, Object> params = new java.util.HashMap<>();
        params.put("definition_key", request.definitionKey());
        params.put("context", request.context());
        params.put("idempotency_key", request.idempotencyKey() == null
                || request.idempotencyKey().isBlank()
                ? "api:" + UUID.randomUUID() : request.idempotencyKey());
        params.put("source_ref", request.sourceRef());
        params.put("initiated_by", request.initiatedBy());
        WorkflowInstance instance = engineService.open(
                request.definitionKey(),
                request.context(),
                "API",
                (String) params.get("idempotency_key"),
                request.sourceRef(),
                request.initiatedBy());
        return ApiResponse.success("WORKFLOW_INSTANCE_OPENED", "Instance opened.", instance);
    }

    @GET
    @Path("/instances/{id}")
    public ApiResponse<Map<String, Object>> progress(@PathParam("id") UUID id) {
        var instanceRows = client.query("instance.get", Map.of("id", id)).rows();
        if (instanceRows.isEmpty()) {
            throw new ApiException(404, "INSTANCE_NOT_FOUND", "Instance was not found");
        }
        List<WorkflowTask> tasks = client.query("task.list_by_instance",
                Map.of("instance_id", id)).rows().stream()
                .map(WorkflowTask::from)
                .toList();
        List<Map<String, Object>> events = client.query("event.list_by_instance",
                Map.of("instance_id", id)).rows();
        return ApiResponse.success("WORKFLOW_INSTANCE_PROGRESS",
                "Instance progress retrieved.",
                Map.of(
                        "instance", instanceRows.get(0),
                        "tasks", tasks,
                        "events", events));
    }

    public record TaskActionRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("actor_user_id") UUID actorUserId,
            String action, String comment,
            @com.fasterxml.jackson.annotation.JsonProperty("target_step_node_id") String targetStepNodeId,
            @com.fasterxml.jackson.annotation.JsonProperty("target_user_id") UUID targetUserId) {}

    @POST
    @Path("/tasks/{id}/actions")
    public ApiResponse<WorkflowTask> act(@PathParam("id") UUID id, TaskActionRequest request) {
        if (request == null || request.actorUserId() == null) {
            throw new ApiException(400, "TASK_ACTOR_REQUIRED", "actor_user_id is required");
        }
        WorkflowTask task = engineService.act(id, request.actorUserId(), request.action(),
                request.comment(), request.targetStepNodeId(), request.targetUserId());
        return ApiResponse.success("WORKFLOW_TASK_ACTION_SUCCESS", "Action applied.", task);
    }

    // ---- Core-driven SLA scan (quartz is not part of the minimal core) --

    @POST
    @Path("/sla-scan")
    public ApiResponse<Map<String, Object>> slaScan() {
        int changes = engineService.scanSla();
        return ApiResponse.success("WORKFLOW_SLA_SCANNED", "SLA scan completed.",
                Map.of("changes", changes));
    }

    // ---- Tenant bootstrap (pattern: PluginTenantBootstrapService) -----

    /** Root contract lives in {@link WorkflowBootstrapResource}; kept here for
     * the /api/v1/workflow/internal surface used by ops tooling. */
    @POST
    @Path("/tenant/bootstrap")
    public ApiResponse<Map<String, Object>> bootstrap() {
        return bootstrapTenant();
    }

    public ApiResponse<Map<String, Object>> bootstrapTenant() {
        ensureEmployeeProfileChangeDefinition();
        return ApiResponse.success("WORKFLOW_BOOTSTRAP_SUCCESS", "Tenant bootstrapped.",
                Map.of("definition_key", EMPLOYEE_PROFILE_CHANGE_KEY));
    }

    @SuppressWarnings("unchecked")
    private void ensureEmployeeProfileChangeDefinition() {
        var existing = client.query("definition.latest", Map.of(
                "key", EMPLOYEE_PROFILE_CHANGE_KEY, "status", "PUBLISHED")).rows();
        if (!existing.isEmpty()) {
            return;
        }
        Map<String, Object> document = Map.of("nodes", List.of(
                Map.of("id", "start", "type", "START", "next", "step_manager"),
                Map.of("id", "step_manager", "type", "APPROVAL",
                        "name", "Quản lý trực tiếp",
                        "approval_mode", "ANY_ONE",
                        "assignment", Map.of("kind", "MANAGER_OF",
                                "field_ref", "initiator.manager_user_id"),
                        "sla", Map.of("due_hours", 48, "remind_before_hours", 12),
                        "next", "step_role"),
                Map.of("id", "step_role", "type", "APPROVAL",
                        "name", "Theo vai trò",
                        "approval_mode", "ANY_ONE",
                        "assignment", Map.of("kind", "ROLE", "role", "TENANT_ADMIN"),
                        "sla", Map.of("due_hours", 72, "remind_before_hours", 24),
                        "next", "end"),
                Map.of("id", "end", "type", "END", "outcome", "APPROVED")));
        String documentJson;
        try {
            documentJson = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(document);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot serialize seed document", e);
        }
        var result = client.write("definition.insert", Map.of(
                "key", EMPLOYEE_PROFILE_CHANGE_KEY,
                "version", 1,
                "status", "PUBLISHED",
                "document", documentJson));
        client.write("definition.publish", Map.of(
                "id", result.first().get("id"),
                "status", "PUBLISHED",
                "published_at", OffsetDateTime.now()));
    }
}
