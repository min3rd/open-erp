package com.vn9melody.openerp.plugins.workflow.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.workflow.api.WorkflowErrorCode;
import com.vn9melody.openerp.plugins.workflow.dto.WorkflowDefinitionDto;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowInstance;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowTask;
import com.vn9melody.openerp.plugins.workflow.service.WorkflowDefinitionService;
import com.vn9melody.openerp.plugins.workflow.service.WorkflowEngineService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1/workflow")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorkflowResource {

    @Inject
    WorkflowDefinitionService service;

    @Inject
    WorkflowEngineService engineService;

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext context;

    @GET
    @Path("/definitions")
    @RequirePermission("workflow:definition:manage")
    public ApiResponse<ListData<WorkflowDefinitionDto>> list() {
        return ApiResponse.successList(
                WorkflowErrorCode.WORKFLOW_DEFINITION_LIST_SUCCESS,
                "Workflow definitions retrieved.",
                service.list());
    }

    @GET
    @Path("/definitions/{id}")
    @RequirePermission("workflow:definition:manage")
    public ApiResponse<WorkflowDefinitionDto> get(@PathParam("id") UUID id) {
        return ApiResponse.success(
                WorkflowErrorCode.WORKFLOW_DEFINITION_RETRIEVED,
                "Workflow definition retrieved.",
                service.get(id));
    }

    public record SaveDefinitionRequest(String key, Map<String, Object> document) {}

    @POST
    @Path("/definitions")
    @RequirePermission("workflow:definition:manage")
    public ApiResponse<WorkflowDefinitionDto> create(SaveDefinitionRequest request) {
        return ApiResponse.success(
                "WORKFLOW_DEFINITION_CREATED",
                "Workflow definition created.",
                service.create(request.key(), request.document()));
    }

    @POST
    @Path("/definitions/{id}/publish")
    @RequirePermission("workflow:definition:manage")
    public ApiResponse<WorkflowDefinitionDto> publish(@PathParam("id") UUID id) {
        return ApiResponse.success(
                "WORKFLOW_PUBLISHED",
                "Workflow definition published.",
                service.publish(id));
    }

    @GET
    @Path("/instances")
    @RequirePermission("workflow:instance:read")
    public ApiResponse<ListData<WorkflowInstance>> instances() {
        return ApiResponse.successList(
                "WORKFLOW_INSTANCE_LIST_SUCCESS",
                "Instances retrieved.",
                client.query("instance.list", Map.of()).rows().stream()
                        .map(WorkflowInstance::from)
                        .toList());
    }

    @GET
    @Path("/instances/{id}")
    @RequirePermission("workflow:instance:read")
    public ApiResponse<Map<String, Object>> progress(@PathParam("id") UUID id) {
        List<Map<String, Object>> rows = client.query("instance.get", Map.of("id", id)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, "INSTANCE_NOT_FOUND", "Instance was not found");
        }
        List<WorkflowTask> tasks = client.query("task.list_by_instance",
                Map.of("instance_id", id)).rows().stream()
                .map(WorkflowTask::from)
                .toList();
        return ApiResponse.success("WORKFLOW_INSTANCE_PROGRESS",
                "Instance progress retrieved.",
                Map.of("instance", rows.get(0), "tasks", tasks));
    }

    public record TaskActionRequest(UUID actorUserId, String action, String comment,
            String targetStepNodeId, UUID targetUserId) {}

    @GET
    @Path("/tasks/inbox")
    @RequirePermission("workflow:task:action")
    public ApiResponse<ListData<WorkflowTask>> inbox(
            @QueryParam("scope") String scope) {
        UUID userId = context.userId();
        if (userId == null) {
            throw new ApiException(401, "UNAUTHORIZED", "Authenticated user is required");
        }
        List<WorkflowTask> tasks = client.query("task.inbox",
                Map.of("statuses", List.of("PENDING", "IN_PROGRESS"))).rows().stream()
                .map(WorkflowTask::from)
                .toList();
        boolean mineOnly = scope == null || "MINE".equalsIgnoreCase(scope);
        List<WorkflowTask> filtered = mineOnly
                ? tasks.stream()
                        .filter(task -> task.assignees().contains(userId.toString())
                                || task.candidates().contains(userId.toString()))
                        .toList()
                : tasks;
        return ApiResponse.successList("WORKFLOW_INBOX_SUCCESS",
                "Task inbox retrieved.", filtered);
    }

    @POST
    @Path("/tasks/{id}/actions")
    @RequirePermission("workflow:task:action")
    public ApiResponse<WorkflowTask> act(@PathParam("id") UUID id, TaskActionRequest request) {
        if (request == null || request.actorUserId() == null) {
            throw new ApiException(400, "TASK_ACTOR_REQUIRED", "actor_user_id is required");
        }
        WorkflowTask task = engineService.act(id, request.actorUserId(), request.action(),
                request.comment(), request.targetStepNodeId(), request.targetUserId());
        return ApiResponse.success("WORKFLOW_TASK_ACTION_SUCCESS", "Action applied.", task);
    }
}
