package com.vn9melody.openerp.plugins.employee.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Client for the shared workflow engine (Sprint 08, ADR-S08-004 option C):
 * change-request approval runtime is delegated through the Core internal API;
 * the engine enforces approver identity, SLA and audit for every action.
 */
@ApplicationScoped
public class WorkflowApprovalClient {

    private static final Logger LOG = Logger.getLogger(WorkflowApprovalClient.class);

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "plugin.core.internal-url", defaultValue = "http://backend-dev:8088")
    String coreInternalUrl;

    @Inject
    @ConfigProperty(name = "plugin.data.service-token", defaultValue = "")
    java.util.Optional<String> serviceToken;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public record Progress(WorkflowInstanceView instance, List<TaskView> tasks) {}

    public record WorkflowInstanceView(String id, String status, String outcome) {}

    public record TaskView(String id, String nodeId, String status, String approvalMode,
            List<String> assignees, List<String> candidates, List<Map<String, Object>> actionVotes) {}

    /** Opens an instance for the seeded employee-profile-change definition. */
    public UUID openInstance(UUID initiatedBy, Map<String, Object> context,
            String idempotencyKey, Map<String, Object> sourceRef) {
        JsonNode data = post("/api/v1/internal/workflow/instances", Map.of(
                "definition_key", "employee-profile-change",
                "context", context,
                "idempotency_key", idempotencyKey,
                "source_ref", sourceRef,
                "initiated_by", initiatedBy.toString()));
        return UUID.fromString(data.path("id").asText());
    }

    public Progress progress(UUID instanceId) {
        JsonNode data = get("/api/v1/internal/workflow/instances/" + instanceId);
        JsonNode instance = data.path("instance");
        JsonNode tasks = data.path("tasks");
        List<TaskView> taskViews = new java.util.ArrayList<>();
        for (JsonNode task : tasks) {
            taskViews.add(new TaskView(
                    task.path("id").asText(),
                    task.path("node_id").asText(),
                    task.path("status").asText(),
                    task.path("approval_mode").asText("ANY_ONE"),
                    textList(task.path("assignees")),
                    textList(task.path("candidates")),
                    voteList(task.path("action_votes"))));
        }
        return new Progress(
                new WorkflowInstanceView(
                        instance.path("id").asText(),
                        instance.path("status").asText(),
                        instance.path("outcome").asText(null)),
                taskViews);
    }

    public void act(UUID taskId, UUID actor, String action, String comment,
            String targetStepNodeId, UUID targetUserId) {
        post("/api/v1/internal/workflow/tasks/" + taskId + "/actions", Map.of(
                "actor_user_id", actor.toString(),
                "action", action,
                "comment", comment == null ? "" : comment,
                "target_step_node_id", targetStepNodeId == null ? "" : targetStepNodeId,
                "target_user_id", targetUserId == null ? "" : targetUserId.toString()));
    }

    /** Best-effort ACTIVE TENANT_ADMIN user list (workflow ROLE assignment). */
    public List<String> tenantAdmins() {
        try {
            JsonNode data = get("/api/v1/internal/tenant-admins");
            List<String> ids = new java.util.ArrayList<>();
            data.path("user_ids").forEach(node -> ids.add(node.asText()));
            return ids;
        } catch (Exception e) {
            LOG.warnf("Cannot resolve tenant admins: %s", e.getMessage());
            return List.of();
        }
    }

    private JsonNode get(String path) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(coreInternalUrl + path))
                    .timeout(Duration.ofSeconds(10))
                    .header("X-Plugin-Service-Token", serviceToken.orElse(""))
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofByteArray());
            JsonNode body = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || !body.path("success").asBoolean()) {
                throw new ApiException(502, "WORKFLOW_ENGINE_UNAVAILABLE",
                        "Workflow engine rejected the call (HTTP " + response.statusCode() + ")");
            }
            return body.path("data");
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(503, "WORKFLOW_ENGINE_UNAVAILABLE",
                    "Workflow engine is unavailable");
        }
    }

    private JsonNode post(String path, Map<String, Object> body) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(coreInternalUrl + path))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .header("X-Plugin-Service-Token", serviceToken.orElse(""))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofByteArray());
            JsonNode parsed = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300
                    || !parsed.path("success").asBoolean()) {
                throw new ApiException(502, "WORKFLOW_ENGINE_UNAVAILABLE",
                        "Workflow engine rejected the call (HTTP " + response.statusCode() + ")");
            }
            return parsed.path("data");
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(503, "WORKFLOW_ENGINE_UNAVAILABLE",
                    "Workflow engine is unavailable");
        }
    }

    private List<String> textList(JsonNode node) {
        List<String> values = new java.util.ArrayList<>();
        if (node.isArray()) {
            node.forEach(item -> values.add(item.asText()));
        }
        return values;
    }

    private List<Map<String, Object>> voteList(JsonNode node) {
        List<Map<String, Object>> votes = new java.util.ArrayList<>();
        if (node.isArray()) {
            node.forEach(item -> votes.add(objectMapper.convertValue(item, Map.class)));
        }
        return votes;
    }
}
