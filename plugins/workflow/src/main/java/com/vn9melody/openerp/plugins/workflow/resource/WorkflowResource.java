package com.vn9melody.openerp.plugins.workflow.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import com.vn9melody.openerp.plugins.workflow.api.WorkflowErrorCode;
import com.vn9melody.openerp.plugins.workflow.dto.WorkflowDefinitionDto;
import com.vn9melody.openerp.plugins.workflow.service.WorkflowDefinitionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;

@Path("/api/v1/workflow")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorkflowResource {

    @Inject
    WorkflowDefinitionService service;

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
}
