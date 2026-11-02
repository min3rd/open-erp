package com.vn9melody.openerp.plugins.workflow.model;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record WorkflowTask(
        UUID id,
        UUID instanceId,
        String nodeId,
        String nodeType,
        String status,
        String approvalMode,
        Double voteRatio,
        List<String> assignees,
        List<String> candidates,
        UUID claimedBy,
        List<Map<String, Object>> actionVotes,
        OffsetDateTime dueAt,
        Integer remindBeforeHours,
        List<String> reminderSlots,
        OffsetDateTime overdueAt,
        OffsetDateTime createdAt,
        OffsetDateTime completedAt) {

    private static final List<String> SELECT_FIELDS = List.of(
            "id", "instance_id", "node_id", "node_type", "status", "approval_mode", "vote_ratio",
            "assignees", "candidates", "claimed_by", "action_votes", "due_at",
            "remind_before_hours", "reminder_slots", "overdue_at", "created_at", "completed_at");

    public static List<String> selectFields() {
        return SELECT_FIELDS;
    }

    public static WorkflowTask from(Map<String, Object> row) {
        return new WorkflowTask(
                uuid(row.get("id")),
                uuid(row.get("instance_id")),
                str(row.get("node_id")),
                str(row.get("node_type")),
                str(row.get("status")),
                str(row.get("approval_mode")),
                dblOrNull(row.get("vote_ratio")),
                strList(row.get("assignees")),
                strList(row.get("candidates")),
                uuid(row.get("claimed_by")),
                voteList(row.get("action_votes")),
                time(row.get("due_at")),
                intOrNull(row.get("remind_before_hours")),
                strList(row.get("reminder_slots")),
                time(row.get("overdue_at")),
                time(row.get("created_at")),
                time(row.get("completed_at")));
    }

    private static UUID uuid(Object value) {
        return value == null ? null : UUID.fromString(value.toString());
    }

    private static String str(Object value) {
        return value == null ? null : value.toString();
    }

    private static OffsetDateTime time(Object value) {
        return value == null ? null : OffsetDateTime.parse(value.toString());
    }

    private static Integer intOrNull(Object value) {
        return value instanceof Number n ? n.intValue() : null;
    }

    private static Double dblOrNull(Object value) {
        return value instanceof Number n ? n.doubleValue() : null;
    }

    @SuppressWarnings("unchecked")
    private static List<String> strList(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream().map(String::valueOf).toList();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> voteList(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream()
                .filter(item -> item instanceof Map<?, ?>)
                .map(item -> (Map<String, Object>) item)
                .toList();
    }
}
