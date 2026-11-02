package com.vn9melody.openerp.plugins.workflow.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugins.workflow.api.WorkflowErrorCode;
import com.vn9melody.openerp.plugins.workflow.dto.WorkflowDefinitionDto;
import com.vn9melody.openerp.plugins.workflow.engine.WorkflowNodeTypes;
import com.vn9melody.openerp.plugins.workflow.model.WorkflowDefinition;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class WorkflowDefinitionService {

    @Inject
    PluginDataClient client;

    public List<WorkflowDefinitionDto> list() {
        return client.query("definition.list", Map.of()).rows().stream()
                .map(WorkflowDefinition::from)
                .map(WorkflowDefinitionDto::from)
                .toList();
    }

    public WorkflowDefinitionDto get(UUID id) {
        return WorkflowDefinitionDto.from(load(id));
    }

    /** Validates the definition document graph: node types, single start, forward refs, no cycles. */
    public void validateDocument(Map<String, Object> document) {
        List<Map<String, Object>> nodes = WorkflowNodeTypes.nodes(document);
        if (nodes.isEmpty()) {
            throw new ApiException(400, WorkflowErrorCode.WORKFLOW_DEFINITION_INVALID,
                    "document.nodes must be a non-empty array");
        }
        long starts = nodes.stream()
                .filter(n -> WorkflowNodeTypes.START.equals(n.get("type")))
                .count();
        if (starts != 1) {
            throw new ApiException(400, WorkflowErrorCode.WORKFLOW_DEFINITION_INVALID,
                    "document must contain exactly one START node");
        }
        Map<String, Integer> indexById = new java.util.HashMap<>();
        for (int i = 0; i < nodes.size(); i++) {
            String id = str(nodes.get(i).get("id"));
            if (id == null || indexById.putIfAbsent(id, i) != null) {
                throw new ApiException(400, WorkflowErrorCode.WORKFLOW_DEFINITION_INVALID,
                        "node ids must be unique non-null strings");
            }
            String type = str(nodes.get(i).get("type"));
            if (!WorkflowNodeTypes.ALL.contains(type)) {
                throw new ApiException(400, WorkflowErrorCode.WORKFLOW_DEFINITION_INVALID,
                        "unknown node type '" + type + "'");
            }
        }
        for (Map<String, Object> node : nodes) {
            for (Object next : nextIds(node)) {
                Integer target = indexById.get(str(next));
                if (target == null) {
                    throw new ApiException(400, WorkflowErrorCode.WORKFLOW_DEFINITION_INVALID,
                            "node '" + node.get("id") + "' references unknown node '" + next + "'");
                }
            }
        }
        if (hasCycle(nodes, indexById)) {
            throw new ApiException(400, WorkflowErrorCode.WORKFLOW_DEFINITION_INVALID_CYCLE,
                    "document node graph contains a cycle");
        }
    }

    private List<Object> nextIds(Map<String, Object> node) {
        Object next = node.get("next");
        if (next instanceof List<?> list) {
            return List.copyOf(list);
        }
        return next == null ? List.of() : List.of(next);
    }

    private boolean hasCycle(List<Map<String, Object>> nodes, Map<String, Integer> indexById) {
        int[] color = new int[nodes.size()];
        for (int i = 0; i < nodes.size(); i++) {
            if (color[i] == 0 && dfs(i, nodes, indexById, color)) {
                return true;
            }
        }
        return false;
    }

    private boolean dfs(int i, List<Map<String, Object>> nodes,
            Map<String, Integer> indexById, int[] color) {
        color[i] = 1;
        for (Object next : nextIds(nodes.get(i))) {
            Integer target = indexById.get(str(next));
            if (target == null) {
                continue;
            }
            if (color[target] == 1 || (color[target] == 0 && dfs(target, nodes, indexById, color))) {
                return true;
            }
        }
        color[i] = 2;
        return false;
    }

    private String str(Object value) {
        return value == null ? null : value.toString();
    }

    private WorkflowDefinition load(UUID id) {
        var rows = client.query("definition.get", Map.of("id", id)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, WorkflowErrorCode.WORKFLOW_DEFINITION_NOT_FOUND,
                    "Workflow definition was not found");
        }
        return WorkflowDefinition.from(rows.get(0));
    }
}
