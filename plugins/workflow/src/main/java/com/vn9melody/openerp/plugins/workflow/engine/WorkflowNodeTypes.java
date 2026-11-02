package com.vn9melody.openerp.plugins.workflow.engine;

import java.util.List;
import java.util.Map;

/**
 * Node type contract of the workflow engine (ADR-S08-001). Engine semantics are
 * named after BPMN/Flowable but only the AC subset is implemented.
 */
public final class WorkflowNodeTypes {

    private WorkflowNodeTypes() {}

    public static final String START = "START";
    public static final String END = "END";
    public static final String APPROVAL = "APPROVAL";
    public static final String TASK = "TASK";
    public static final String CONDITION = "CONDITION";
    public static final String PARALLEL = "PARALLEL";
    public static final String AUTO_WEBHOOK = "AUTO_WEBHOOK";
    public static final String AUTO_ENTITY_UPDATE = "AUTO_ENTITY_UPDATE";
    public static final String CC = "CC";

    public static final List<String> ALL = List.of(
            START, END, APPROVAL, TASK, CONDITION, PARALLEL, AUTO_WEBHOOK, AUTO_ENTITY_UPDATE, CC);

    public static final String APPROVAL_ANY_ONE = "ANY_ONE";
    public static final String APPROVAL_ALL = "ALL_APPROVE";
    public static final String APPROVAL_VOTE_RATIO = "VOTE_RATIO";

    public static final String JOIN_ALL = "ALL_COMPLETE";
    public static final String JOIN_ANY = "ANY_COMPLETE";

    public static boolean requiresHuman(String type) {
        return APPROVAL.equals(type) || TASK.equals(type);
    }

    public static boolean isAuto(String type) {
        return AUTO_WEBHOOK.equals(type) || AUTO_ENTITY_UPDATE.equals(type);
    }

    /** Extracts the typed node list from a definition document (null-safe). */
    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> nodes(Map<String, Object> document) {
        if (document == null || !(document.get("nodes") instanceof List<?> nodes)) {
            return List.of();
        }
        return nodes.stream()
                .filter(n -> n instanceof Map<?, ?>)
                .map(n -> (Map<String, Object>) n)
                .toList();
    }
}
