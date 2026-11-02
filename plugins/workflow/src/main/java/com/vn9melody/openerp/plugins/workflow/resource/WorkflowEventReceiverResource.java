package com.vn9melody.openerp.plugins.workflow.resource;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugins.workflow.service.WorkflowTriggerService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

/**
 * Event Hub receiver (SDK convention: POST /api/v1/{plugin}/internal-events —
 * ADR-S08-002 §2.1). The relay forwards matching events; the trigger table
 * decides which definition runs.
 */
@Path("/api/v1/workflow/internal-events")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class WorkflowEventReceiverResource {

    @Inject
    WorkflowTriggerService triggerService;

    public record EventDelivery(
            @com.fasterxml.jackson.annotation.JsonProperty("event_delivery_id") String eventDeliveryId,
            String event,
            @com.fasterxml.jackson.annotation.JsonProperty("source_plugin") String sourcePlugin,
            String entity,
            @com.fasterxml.jackson.annotation.JsonProperty("aggregate_id") String aggregateId,
            Map<String, Object> payload) {}

    @POST
    public ApiResponse<Map<String, Object>> receive(EventDelivery delivery) {
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
}
