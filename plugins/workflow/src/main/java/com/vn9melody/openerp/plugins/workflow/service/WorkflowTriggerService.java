package com.vn9melody.openerp.plugins.workflow.service;

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowDefinition;
import com.vn9melody.openerp.plugins.workflow.resource.WorkflowInternalResource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Map;

/**
 * Matches Event Hub deliveries against tenant triggers (plg_workflow_triggers)
 * and opens instances idempotently — trigger registration is the plugin-level
 * filter on top of the Core hub subscription (ADR-S08-002 §2.1).
 */
@ApplicationScoped
public class WorkflowTriggerService {

    @Inject
    PluginDataClient client;

    @Inject
    WorkflowEngineService engineService;

    public int handle(String deliveryId, String eventType, String sourcePlugin,
            String entity, String aggregateId, Map<String, Object> payload) {
        List<Map<String, Object>> triggers = client.query("trigger.list",
                Map.of("enabled", true)).rows();
        int opened = 0;
        for (Map<String, Object> row : triggers) {
            String triggerSource = String.valueOf(row.get("source_plugin"));
            String triggerEntity = String.valueOf(row.get("entity"));
            String triggerEvent = String.valueOf(row.get("event_type"));
            boolean matches = ("*".equals(triggerSource) || triggerSource.equals(sourcePlugin))
                    && ("*".equals(triggerEntity) || triggerEntity.equals(entity))
                    && ("*".equals(triggerEvent) || triggerEvent.equals(eventType));
            if (!matches) {
                continue;
            }
            Object definitionId = row.get("definition_id");
            engineService.openByDefinitionId(
                    definitionId == null ? null : definitionId.toString(),
                    payload == null ? Map.of() : payload,
                    "EVENT",
                    "trigger:" + row.get("id") + ":" + deliveryId,
                    Map.of("plugin", sourcePlugin == null ? "" : sourcePlugin,
                            "entity", entity == null ? "" : entity,
                            "aggregate_id", aggregateId == null ? "" : aggregateId));
            opened++;
        }
        return opened;
    }
}
