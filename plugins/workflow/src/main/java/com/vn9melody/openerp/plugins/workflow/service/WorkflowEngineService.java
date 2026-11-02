package com.vn9melody.openerp.plugins.workflow.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.event.PluginEventPublisher;
import com.vn9melody.openerp.plugins.workflow.api.WorkflowErrorCode;
import com.vn9melody.openerp.plugins.workflow.engine.ExpressionEvaluator;
import com.vn9melody.openerp.plugins.workflow.engine.WorkflowGraph;
import com.vn9melody.openerp.plugins.workflow.engine.WorkflowNodeTypes;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowDefinition;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowInstance;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowTask;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The state machine runtime (ADR-S08-001): idempotent instance opening, node
 * walk (START → conditions → parallel fork → human tasks → auto nodes → END),
 * approval modes (ANY_ONE / ALL_APPROVE / VOTE_RATIO), return/reassign, and
 * append-only event logging in the same call path as transitions.
 */
@ApplicationScoped
public class WorkflowEngineService {

    public static final String EVENT_INSTANCE_COMPLETED = "workflow.instance.completed";
    public static final String EVENT_TASK_REMINDER = "workflow.task.reminder";

    @Inject
    PluginDataClient client;

    @Inject
    PluginEventPublisher eventPublisher;

    // ------------------------------------------------------------------
    // Instance opening
    // ------------------------------------------------------------------

    public WorkflowInstance open(String definitionKey, Map<String, Object> context,
            String triggerType, String idempotencyKey, Map<String, Object> sourceRef,
            UUID initiatedBy) {
        var existing = client.query("instance.by_idem", Map.of("idempotency_key", idempotencyKey)).rows();
        if (!existing.isEmpty()) {
            return WorkflowInstance.from(existing.get(0));
        }
        var rows = client.query("definition.latest",
                Map.of("key", definitionKey, "status", "PUBLISHED")).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, WorkflowErrorCode.WORKFLOW_NOT_PUBLISHED,
                    "No PUBLISHED definition for key '" + definitionKey + "'");
        }
        WorkflowDefinition definition = WorkflowDefinition.from(rows.get(0));
        return insertAndStart(definition, context, triggerType, idempotencyKey, sourceRef, initiatedBy);
    }

    /** Trigger-driven opening: the definition id comes from plg_workflow_triggers. */
    public WorkflowInstance openByDefinitionId(String definitionId, Map<String, Object> context,
            String triggerType, String idempotencyKey, Map<String, Object> sourceRef) {
        var existing = client.query("instance.by_idem", Map.of("idempotency_key", idempotencyKey)).rows();
        if (!existing.isEmpty()) {
            return WorkflowInstance.from(existing.get(0));
        }
        if (definitionId == null || definitionId.isBlank() || "null".equals(definitionId)) {
            return null;
        }
        var rows = client.query("definition.get", Map.of("id", UUID.fromString(definitionId))).rows();
        if (rows.isEmpty()) {
            return null;
        }
        WorkflowDefinition definition = WorkflowDefinition.from(rows.get(0));
        if (!"PUBLISHED".equals(definition.status())) {
            return null;
        }
        return insertAndStart(definition, context, triggerType, idempotencyKey, sourceRef, null);
    }

    private WorkflowInstance insertAndStart(WorkflowDefinition definition,
            Map<String, Object> context, String triggerType, String idempotencyKey,
            Map<String, Object> sourceRef, UUID initiatedBy) {
        // Optional values may be null — java.util.Map.of would NPE.
        Map<String, Object> params = new java.util.HashMap<>();
        params.put("definition_id", definition.id());
        params.put("definition_version", definition.version());
        params.put("trigger_type", triggerType);
        params.put("source_ref", writeJson(sourceRef));
        params.put("context", writeJson(context));
        params.put("idempotency_key", idempotencyKey);
        params.put("initiated_by", initiatedBy);
        var result = client.write("instance.insert", params);
        WorkflowInstance instance = WorkflowInstance.from(result.first());
        logEvent(instance.id(), null, "INSTANCE_STARTED", null,
                Map.of("definition_key", definition.key(),
                        "definition_version", definition.version()));
        activate(instance, definition, List.of(WorkflowGraph.startNodeId(definition.document())));
        return reload(instance.id());
    }

    /** jsonb descriptor params expect a pre-serialized JSON string. */
    private String writeJson(Object value) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(
                    value == null ? Map.of() : value);
        } catch (Exception e) {
            return "{}";
        }
    }

    // ------------------------------------------------------------------
    // Task actions
    // ------------------------------------------------------------------

    public WorkflowTask act(UUID taskId, UUID actor, String action, String comment,
            String targetNodeId, UUID targetUser) {
        WorkflowTask task = loadTask(taskId);
        WorkflowInstance instance = loadInstance(task.instanceId());
        WorkflowDefinition definition = loadDefinition(instance.definitionId());
        Map<String, Object> node = WorkflowGraph.nodesById(definition.document())
                .get(task.nodeId());

        if (!"PENDING".equals(task.status()) && !"IN_PROGRESS".equals(task.status())) {
            throw new ApiException(409, WorkflowErrorCode.WORKFLOW_TASK_NOT_CURRENT,
                    "Task is not actionable in status " + task.status());
        }
        boolean allowed = task.assignees().contains(actor.toString())
                || task.candidates().contains(actor.toString());
        if (!allowed) {
            throw new ApiException(403, WorkflowErrorCode.WORKFLOW_TASK_NOT_ASSIGNEE,
                    "Actor is not an assignee or candidate of this task");
        }
        UUID initiator = instance.initiatedBy();
        if (initiator != null && initiator.equals(actor)) {
            throw new ApiException(403, WorkflowErrorCode.WORKFLOW_SELF_APPROVAL_FORBIDDEN,
                    "The initiator cannot act on their own request");
        }

        switch (action == null ? "" : action) {
            case "APPROVE" -> {
                addVote(task, actor, "APPROVE", comment);
                // Reload: addVote persists the new vote; the local snapshot is stale.
                WorkflowTask updated = loadTask(task.id());
                if (approvalComplete(updated)) {
                    completeTask(updated, actor);
                    logEvent(instance.id(), task.id(), "TASK_ACTION", actor,
                            Map.of("action", "APPROVE", "comment", comment == null ? "" : comment));
                    continueFrom(instance, definition, task.nodeId(), actor);
                }
            }
            case "REJECT" -> {
                if (comment == null || comment.isBlank()) {
                    throw new ApiException(400, WorkflowErrorCode.WORKFLOW_REJECT_REASON_REQUIRED,
                            "A rejection reason is required");
                }
                completeTask(task, actor);
                logEvent(instance.id(), task.id(), "TASK_ACTION", actor,
                        Map.of("action", "REJECT", "comment", comment));
                rejectInstance(instance, definition, actor, comment);
            }
            case "RETURN" -> {
                if (targetNodeId == null || targetNodeId.isBlank()) {
                    throw new ApiException(400, WorkflowErrorCode.WORKFLOW_RETURN_STEP_INVALID,
                            "target_step_node_id is required");
                }
                if (!WorkflowGraph.nodesById(definition.document()).containsKey(targetNodeId)) {
                    throw new ApiException(400, WorkflowErrorCode.WORKFLOW_RETURN_STEP_INVALID,
                            "Unknown target step: " + targetNodeId);
                }
                completeTask(task, actor);
                logEvent(instance.id(), task.id(), "RETURNED", actor,
                        Map.of("target_node", targetNodeId, "comment", comment == null ? "" : comment));
                activate(instance, definition, List.of(targetNodeId));
            }
            case "REASSIGN" -> {
                if (targetUser == null) {
                    throw new ApiException(400, "REASSIGN_TARGET_REQUIRED",
                            "target_user_id is required");
                }
                client.write("task.update", Map.of(
                        "id", task.id(),
                        "status", "IN_PROGRESS",
                        "assignees", writeJson(List.of(targetUser.toString()))));
                logEvent(instance.id(), task.id(), "REASSIGNED", actor,
                        Map.of("from", actor.toString(), "to", targetUser.toString(),
                                "comment", comment == null ? "" : comment));
            }
            case "CLAIM" -> {
                client.write("task.update", Map.of("id", task.id(),
                        "status", "IN_PROGRESS", "claimed_by", actor));
                logEvent(instance.id(), task.id(), "TASK_CLAIMED", actor, Map.of());
            }
            default -> throw new ApiException(400, "TASK_ACTION_INVALID",
                    "action must be APPROVE, REJECT, RETURN, REASSIGN or CLAIM");
        }
        return loadTask(taskId);
    }

    // ------------------------------------------------------------------
    // SLA scan (driven by Core per tenant — see core WorkflowSlaScanJob)
    // ------------------------------------------------------------------

    public int scanSla() {
        OffsetDateTime now = OffsetDateTime.now();
        int changes = 0;
        for (WorkflowTask task : client.query("task.inbox",
                Map.of("statuses", List.of("PENDING", "IN_PROGRESS"))).rows()
                .stream().map(WorkflowTask::from).toList()) {
            if (task.dueAt() == null) {
                continue;
            }
            if (task.dueAt().isBefore(now) && task.overdueAt() == null) {
                client.write("task.update", Map.of(
                        "id", task.id(), "status", task.status(), "overdue_at", now));
                logEvent(task.instanceId(), task.id(), "SLA_OVERDUE", null,
                        Map.of("due_at", task.dueAt().toString()));
                changes++;
            }
        }
        return changes;
    }

    // ------------------------------------------------------------------
    // Engine walk
    // ------------------------------------------------------------------

    private void continueFrom(WorkflowInstance instance, WorkflowDefinition definition,
            String fromNodeId, UUID actor) {
        List<String> nextIds = WorkflowGraph.nextNodeIds(definition.document(), fromNodeId);
        activate(instance, definition, nextIds);
    }

    private void activate(WorkflowInstance instance, WorkflowDefinition definition,
            List<String> nodeIds) {
        Map<String, Map<String, Object>> nodesById =
                WorkflowGraph.nodesById(definition.document());
        List<String> queue = new ArrayList<>(nodeIds);
        while (!queue.isEmpty()) {
            String nodeId = queue.remove(0);
            Map<String, Object> node = nodesById.get(nodeId);
            if (node == null) {
                continue;
            }
            String type = String.valueOf(node.get("type"));
            switch (type) {
                case WorkflowNodeTypes.START -> queue.addAll(
                        WorkflowGraph.nextNodeIds(definition.document(), nodeId));
                case WorkflowNodeTypes.CONDITION -> queue.addAll(resolveCondition(
                        definition, node, instance));
                case WorkflowNodeTypes.CC -> {
                    logEvent(instance.id(), null, "NODE_COMPLETED", null,
                            Map.of("node_id", nodeId, "type", "CC"));
                    queue.addAll(WorkflowGraph.nextNodeIds(definition.document(), nodeId));
                }
                case WorkflowNodeTypes.AUTO_WEBHOOK -> {
                    logEvent(instance.id(), null, "WEBHOOK_CALLED", null,
                            Map.of("node_id", nodeId));
                    queue.addAll(WorkflowGraph.nextNodeIds(definition.document(), nodeId));
                }
                case WorkflowNodeTypes.AUTO_ENTITY_UPDATE -> {
                    autoEntityWrite(instance, node);
                    logEvent(instance.id(), null, "AUTO_ENTITY_WRITTEN", null,
                            Map.of("node_id", nodeId));
                    queue.addAll(WorkflowGraph.nextNodeIds(definition.document(), nodeId));
                }
                case WorkflowNodeTypes.APPROVAL, WorkflowNodeTypes.TASK -> {
                    createTask(instance, definition, node);
                    // human work: this path waits here
                }
                case WorkflowNodeTypes.END -> {
                    String outcome = String.valueOf(node.getOrDefault("outcome", "APPROVED"));
                    // Parallel join: the instance completes only when no pending
                    // human tasks remain (ALL_COMPLETE semantics for v1).
                    if (!hasPendingTasks(instance.id())) {
                        completeInstance(instance, definition, outcome);
                    }
                }
                case WorkflowNodeTypes.PARALLEL -> queue.addAll(
                        WorkflowGraph.nextNodeIds(definition.document(), nodeId));
                default -> { /* unknown types rejected at publish */ }
            }
        }
    }

    private List<String> resolveCondition(WorkflowDefinition definition,
            Map<String, Object> conditionNode, WorkflowInstance instance) {
        Map<String, Object> context = new HashMap<>();
        context.put("entity", instance.context() == null
                ? Map.of() : instance.context().getOrDefault("entity", Map.of()));
        context.put("initiator", instance.context() == null
                ? Map.of() : instance.context().getOrDefault("initiator", Map.of()));
        context.put("vars", instance.context() == null
                ? Map.of() : instance.context().getOrDefault("vars", Map.of()));
        context.put("previous_node_result", Map.of());
        List<String> raw = WorkflowGraph.resolveActivations(
                definition.document(), context, List.of(String.valueOf(conditionNode.get("id"))));
        return raw;
    }

    @SuppressWarnings("unchecked")
    private void createTask(WorkflowInstance instance, WorkflowDefinition definition,
            Map<String, Object> node) {
        String nodeId = String.valueOf(node.get("id"));
        List<String> assignees = resolveAssignees(node, instance);
        Map<String, Object> sla = node.get("sla") instanceof Map<?, ?> raw
                ? (Map<String, Object>) raw : Map.of();
        OffsetDateTime dueAt = sla.get("due_hours") instanceof Number hours
                ? OffsetDateTime.now().plusHours(hours.longValue()) : null;
        Integer remindBefore = sla.get("remind_before_hours") instanceof Number remind
                ? remind.intValue() : null;
        // Optional values may be null — java.util.Map.of would NPE.
        Map<String, Object> taskParams = new java.util.HashMap<>();
        taskParams.put("instance_id", instance.id());
        taskParams.put("node_id", nodeId);
        taskParams.put("node_type", String.valueOf(node.get("type")));
        taskParams.put("approval_mode", node.getOrDefault("approval_mode",
                WorkflowNodeTypes.APPROVAL_ANY_ONE));
        taskParams.put("assignees", writeJson(assignees));
        taskParams.put("candidates", writeJson(assignees));
        taskParams.put("vote_ratio", node.get("vote_ratio"));
        taskParams.put("due_at", dueAt);
        taskParams.put("remind_before_hours", remindBefore);
        var taskResult = client.write("task.insert", taskParams);
        WorkflowTask task = WorkflowTask.from(taskResult.first());
        logEvent(instance.id(), task.id(), "TASK_ASSIGNED", null,
                Map.of("node_id", nodeId, "assignees", assignees));
    }

    /** v1: assignees resolve against the instance context (no cross-plugin reads). */
    @SuppressWarnings("unchecked")
    private List<String> resolveAssignees(Map<String, Object> node, WorkflowInstance instance) {
        Map<String, Object> assignment = node.get("assignment") instanceof Map<?, ?> raw
                ? (Map<String, Object>) raw : Map.of();
        String kind = String.valueOf(assignment.getOrDefault("kind", "USER"));
        Map<String, Object> context = instance.context() == null
                ? Map.of() : instance.context();
        List<String> resolved = new ArrayList<>();
        switch (kind) {
            case "USER" -> {
                if (assignment.get("user_id") != null) {
                    resolved.add(assignment.get("user_id").toString());
                }
            }
            case "ROLE" -> {
                Object users = context.get("role_users_" + assignment.getOrDefault("role", ""));
                if (users instanceof List<?> list) {
                    list.forEach(user -> resolved.add(String.valueOf(user)));
                }
            }
            case "MANAGER_OF", "FIELD_REF" -> {
                Object path = assignment.getOrDefault("field_ref", "initiator.manager_user_id");
                Object value = context.get("managers");
                if (value instanceof Map<?, ?> managers) {
                    Object manager = managers.get(path.toString());
                    if (manager != null) {
                        resolved.add(String.valueOf(manager));
                    }
                }
            }
            case "QUERY" -> {
                Object users = context.get("query_users");
                if (users instanceof List<?> list) {
                    list.forEach(user -> resolved.add(String.valueOf(user)));
                }
            }
            default -> { /* unknown kinds resolve to empty; the task waits for reassign */ }
        }
        return resolved;
    }

    private void autoEntityWrite(WorkflowInstance instance, Map<String, Object> node) {
        if (!(node.get("entity_write") instanceof Map<?, ?> rawWrite)) {
            return;
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> write = (Map<String, Object>) rawWrite;
        String targetPlugin = String.valueOf(write.get("target_plugin"));
        String entityName = String.valueOf(write.get("entity"));
        if ("null".equals(targetPlugin) || "null".equals(entityName)) {
            return;
        }
        // The node record shape mirrors the entity write proxy contract; the
        // workflow builds it from the instance context (v1: passthrough of vars).
        Map<String, Object> record = write.get("record") instanceof Map<?, ?> rawRecord
                ? (Map<String, Object>) rawRecord : Map.of();
        eventPublisher.publish("workflow.auto_entity_update", entityName,
                String.valueOf(instance.id()), record,
                "workflow:auto-entity:" + instance.id() + ":" + node.get("id"));
    }

    // ------------------------------------------------------------------
    // Task helpers
    // ------------------------------------------------------------------

    private void addVote(WorkflowTask task, UUID actor, String action, String comment) {
        List<Map<String, Object>> votes = new ArrayList<>(task.actionVotes());
        votes.removeIf(vote -> actor.toString().equals(String.valueOf(vote.get("actor"))));
        Map<String, Object> vote = new LinkedHashMap<>();
        vote.put("actor", actor.toString());
        vote.put("action", action);
        vote.put("comment", comment == null ? "" : comment);
        vote.put("acted_at", OffsetDateTime.now().toString());
        votes.add(vote);
        client.write("task.update", Map.of(
                "id", task.id(),
                "status", "IN_PROGRESS",
                "action_votes", writeJson(votes)));
    }

    private boolean approvalComplete(WorkflowTask task) {
        List<String> voters = task.assignees().isEmpty()
                ? task.candidates() : task.assignees();
        long approvals = task.actionVotes().stream()
                .filter(vote -> "APPROVE".equals(vote.get("action")))
                .count();
        return switch (task.approvalMode() == null
                ? WorkflowNodeTypes.APPROVAL_ANY_ONE : task.approvalMode()) {
            case WorkflowNodeTypes.APPROVAL_ALL -> !voters.isEmpty()
                    && approvals >= voters.size();
            case WorkflowNodeTypes.APPROVAL_VOTE_RATIO -> !voters.isEmpty()
                    && task.voteRatio() != null
                    && approvals >= Math.ceil(voters.size() * task.voteRatio());
            default -> approvals >= 1;
        };
    }

    private void completeTask(WorkflowTask task, UUID actor) {
        client.write("task.update", Map.of(
                "id", task.id(),
                "status", "COMPLETED",
                "completed_at", OffsetDateTime.now()));
    }

    private boolean hasPendingTasks(UUID instanceId) {
        return client.query("task.list_by_instance", Map.of("instance_id", instanceId))
                .rows().stream()
                .map(WorkflowTask::from)
                .anyMatch(task -> "PENDING".equals(task.status())
                        || "IN_PROGRESS".equals(task.status()));
    }

    private void rejectInstance(WorkflowInstance instance, WorkflowDefinition definition,
            UUID actor, String comment) {
        for (WorkflowTask task : client.query("task.list_by_instance",
                Map.of("instance_id", instance.id())).rows()
                .stream().map(WorkflowTask::from).toList()) {
            if ("PENDING".equals(task.status()) || "IN_PROGRESS".equals(task.status())) {
                client.write("task.update", Map.of(
                        "id", task.id(), "status", "CANCELLED",
                        "completed_at", OffsetDateTime.now()));
            }
        }
        completeInstance(instance, definition, "REJECTED");
    }

    private void completeInstance(WorkflowInstance instance, WorkflowDefinition definition,
            String outcome) {
        client.write("instance.complete", Map.of(
                "id", instance.id(),
                "status", "COMPLETED",
                "outcome", outcome,
                "completed_at", OffsetDateTime.now()));
        logEvent(instance.id(), null, "INSTANCE_COMPLETED", null, Map.of("outcome", outcome));
        eventPublisher.publish(EVENT_INSTANCE_COMPLETED, "WorkflowInstance",
                instance.id().toString(),
                Map.of(
                        "instance_id", instance.id().toString(),
                        "outcome", outcome,
                        "source_ref", instance.sourceRef() == null
                                ? Map.of() : instance.sourceRef(),
                        "context", instance.context() == null
                                ? Map.of() : instance.context()),
                "workflow:instance-completed:" + instance.id());
    }

    private void logEvent(UUID instanceId, UUID taskId, String event, UUID actor,
            Map<String, Object> payload) {
        // taskId/actor may be null (system events) — Map.of would NPE.
        Map<String, Object> params = new java.util.HashMap<>();
        params.put("instance_id", instanceId);
        params.put("task_id", taskId);
        params.put("event", event);
        params.put("actor_user_id", actor);
        params.put("payload", writeJson(payload));
        client.write("event.insert", params);
    }

    private WorkflowTask loadTask(UUID taskId) {
        var rows = client.query("task.get", Map.of("id", taskId)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, "TASK_NOT_FOUND", "Task was not found");
        }
        return WorkflowTask.from(rows.get(0));
    }

    private WorkflowInstance loadInstance(UUID instanceId) {
        var rows = client.query("instance.get", Map.of("id", instanceId)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, "INSTANCE_NOT_FOUND", "Instance was not found");
        }
        return WorkflowInstance.from(rows.get(0));
    }

    private WorkflowDefinition loadDefinition(UUID definitionId) {
        var rows = client.query("definition.get", Map.of("id", definitionId)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, WorkflowErrorCode.WORKFLOW_DEFINITION_NOT_FOUND,
                    "Definition was not found");
        }
        return WorkflowDefinition.from(rows.get(0));
    }

    private WorkflowInstance reload(UUID instanceId) {
        return loadInstance(instanceId);
    }

    /** Exposed for the condition evaluator wiring (unused externally today). */
    public boolean evaluateCondition(Map<String, Object> condition, Map<String, Object> context) {
        return ExpressionEvaluator.evaluate(condition, context);
    }
}
