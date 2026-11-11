package com.vn9melody.openerp.plugins.attendance.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugins.attendance.api.AttendanceErrorCode;
import com.vn9melody.openerp.plugins.attendance.dto.RequestDtos.WorkflowEventPayload;
import com.vn9melody.openerp.plugins.attendance.service.RequestService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.Map;
import java.util.UUID;

@Path("/internal")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class AttendanceInternalResource {

    @Inject
    RequestService requestService;

    @POST
    @Path("/events")
    public ApiResponse<Map<String, Object>> handleInternalEvent(WorkflowEventPayload payload) {
        if (payload != null && "workflow.instance.completed".equalsIgnoreCase(payload.event())) {
            UUID requestId = null;
            if (payload.businessKey() != null && !payload.businessKey().isBlank()) {
                try {
                    requestId = UUID.fromString(payload.businessKey());
                } catch (Exception ignored) {}
            } else if (payload.variables() != null && payload.variables().get("request_id") != null) {
                try {
                    requestId = UUID.fromString(payload.variables().get("request_id").toString());
                } catch (Exception ignored) {}
            }

            if (requestId != null) {
                requestService.handleWorkflowCompletedEvent(requestId, payload.outcome(), payload.comment());
            }
        }

        return ApiResponse.success(
                AttendanceErrorCode.ATTENDANCE_EVENT_HANDLED,
                "Internal event processed",
                Map.of("processed", true)
        );
    }
}

