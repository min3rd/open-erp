package com.vn9melody.openerp.plugins.workflow.engine;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Pure graph helpers over the definition document (ADR-S08-001 §3). No DB
 * access — the walk decides which nodes activate next; DB effects stay in the
 * services so the engine remains unit-testable.
 */
public final class WorkflowGraph {

    private WorkflowGraph() {}

    /** Returns the next node ids to activate after the given node was finished. */
    public static List<String> nextNodeIds(Map<String, Object> document, String finishedNodeId) {
        Map<String, Map<String, Object>> byId = nodesById(document);
        Map<String, Object> finished = byId.get(finishedNodeId);
        if (finished == null) {
            return List.of();
        }
        List<String> next = new ArrayList<>();
        collectNext(finished, next);
        return List.copyOf(next);
    }

    /** Start node id of the document (exactly one START is validated upstream). */
    public static String startNodeId(Map<String, Object> document) {
        for (Map<String, Object> node : WorkflowNodeTypes.nodes(document)) {
            if (WorkflowNodeTypes.START.equals(node.get("type"))) {
                return String.valueOf(node.get("id"));
            }
        }
        return null;
    }

    public static Map<String, Map<String, Object>> nodesById(Map<String, Object> document) {
        Map<String, Map<String, Object>> byId = new LinkedHashMap<>();
        for (Map<String, Object> node : WorkflowNodeTypes.nodes(document)) {
            byId.put(String.valueOf(node.get("id")), node);
        }
        return byId;
    }

    /**
     * CONDITION nodes pick the first matching branch; PARALLEL expands its
     * branch arrays into parallel activations. Resolution needs the context
     * (entity snapshot + vars) to evaluate condition expressions.
     */
    public static List<String> resolveActivations(Map<String, Object> document,
            Map<String, Object> conditionContext, List<String> nextIds) {
        List<String> activations = new ArrayList<>();
        Map<String, Map<String, Object>> byId = nodesById(document);
        for (String nextId : nextIds) {
            Map<String, Object> node = byId.get(nextId);
            if (node == null) {
                continue;
            }
            if (WorkflowNodeTypes.CONDITION.equals(node.get("type"))) {
                activations.addAll(resolveCondition(node, conditionContext));
            } else {
                activations.add(nextId);
            }
        }
        return List.copyOf(activations);
    }

    @SuppressWarnings("unchecked")
    private static List<String> resolveCondition(Map<String, Object> conditionNode,
            Map<String, Object> context) {
        if (!(conditionNode.get("branches") instanceof List<?> branches)) {
            return List.of();
        }
        for (Object branchObj : branches) {
            if (!(branchObj instanceof Map<?, ?> rawBranch)) {
                continue;
            }
            Map<String, Object> branch = (Map<String, Object>) rawBranch;
            if (!ExpressionEvaluator.evaluate(
                    (Map<String, Object>) branch.getOrDefault("when", Map.of()), context)) {
                continue;
            }
            List<String> activations = new ArrayList<>();
            if (branch.get("next") instanceof List<?> nextList) {
                for (Object next : nextList) {
                    activations.add(String.valueOf(next));
                }
            } else if (branch.get("next") != null) {
                activations.add(String.valueOf(branch.get("next")));
            }
            return activations;
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private static void collectNext(Map<String, Object> node, List<String> next) {
        Object nextField = node.get("next");
        if (nextField instanceof List<?> list) {
            for (Object item : list) {
                next.add(String.valueOf(item));
            }
        } else if (nextField != null) {
            next.add(String.valueOf(nextField));
        }
        // PARALLEL nodes store branches as arrays of node id lists.
        if (WorkflowNodeTypes.PARALLEL.equals(node.get("type"))
                && node.get("branches") instanceof List<?> branchLists) {
            for (Object branchObj : branchLists) {
                if (branchObj instanceof List<?> branch) {
                    for (Object item : branch) {
                        next.add(String.valueOf(item));
                    }
                }
            }
        }
    }
}
