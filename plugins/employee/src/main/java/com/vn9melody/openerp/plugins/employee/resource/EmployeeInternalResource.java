package com.vn9melody.openerp.plugins.employee.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugins.employee.service.EmployeeService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.UUID;

/**
 * Event Hub receiver (ADR-S08-002 §2.1): the engine completes instances also
 * through webhook/automation paths, so the change-request mirror syncs on
 * `workflow.instance.completed` in addition to the synchronous approve path.
 */
@Path("/api/v1/employee/internal")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmployeeInternalResource {

    @Inject
    EmployeeService employeeService;

    public record EventDelivery(String eventDeliveryId, String event, String sourcePlugin,
            String entity, String aggregateId, Map<String, Object> payload) {}

    @POST
    @Path("/events")
    public ApiResponse<Map<String, Object>> receive(EventDelivery delivery) {
        int synced = 0;
        if (delivery != null && delivery.payload() != null
                && "workflow.instance.completed".equals(delivery.event())) {
            Object requestId = delivery.payload().get("change_request_id");
            if (requestId != null) {
                try {
                    employeeService.syncFromWorkflow(UUID.fromString(requestId.toString()));
                    synced = 1;
                } catch (Exception ignored) {
                    // The mirror is best-effort; the engine event log stays the
                    // source of truth and the next delivery retry re-syncs.
                }
            }
        }
        return ApiResponse.success("EMPLOYEE_EVENT_SYNCED", "Event processed.",
                Map.of("synced", synced));
    }
}
