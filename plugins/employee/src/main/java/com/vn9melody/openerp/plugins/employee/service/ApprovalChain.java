package com.vn9melody.openerp.plugins.employee.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;

/**
 * Pure approval-chain resolver (TASK-432). Config rows are matched by field
 * group and by the employee's branch/department; the most specific scope wins
 * for a given configured step number. Steps are renumbered from 1 so the
 * request state machine can treat {@code current_step} as a sequence.
 */
public final class ApprovalChain {

    /** One configured approval row as read from the data gateway. */
    public record ConfigRow(String scopeType, UUID scopeId, String fieldGroup,
                            Integer stepNo, String approverType, UUID approverId) {
    }

    /** One effective approval step stored on a change request. */
    public record Step(int stepNo, String approverType, UUID approverId) {
    }

    private static final String ALL_GROUPS = "ALL";
    private static final String PROFILE_GROUPS = "PROFILE";

    private ApprovalChain() {
    }

    public static List<Step> resolve(List<ConfigRow> configs, Set<String> groups,
                                     UUID branchId, UUID departmentId) {
        if (configs == null || configs.isEmpty()) {
            return defaultChain();
        }
        Set<String> wanted = groups == null ? Set.of() : groups.stream()
            .filter(group -> group != null && !group.isBlank())
            .map(group -> group.trim().toUpperCase(Locale.ROOT))
            .collect(java.util.stream.Collectors.toUnmodifiableSet());
        Map<Integer, Candidate> byStep = new TreeMap<>();
        for (ConfigRow row : configs) {
            if (row == null || row.stepNo() == null || row.stepNo() < 1) {
                continue;
            }
            if (!matchesGroup(row.fieldGroup(), wanted)) {
                continue;
            }
            int rank = scopeRank(row.scopeType(), row.scopeId(), branchId, departmentId);
            if (rank == 0) {
                continue;
            }
            Candidate candidate = new Candidate(rank, normalize(row.fieldGroup()),
                row.approverType(), row.approverId());
            Candidate current = byStep.get(row.stepNo());
            if (current == null || candidate.precedes(current)) {
                byStep.put(row.stepNo(), candidate);
            }
        }
        if (byStep.isEmpty()) {
            return defaultChain();
        }
        List<Step> steps = new ArrayList<>(byStep.size());
        int stepNo = 1;
        for (Candidate candidate : byStep.values()) {
            steps.add(new Step(stepNo++, candidate.approverType(), candidate.approverId()));
        }
        return List.copyOf(steps);
    }

    public static List<Step> defaultChain() {
        return List.of(new Step(1, "ROLE", null));
    }

    private static boolean matchesGroup(String configured, Set<String> wanted) {
        String group = normalize(configured);
        if (ALL_GROUPS.equals(group) || PROFILE_GROUPS.equals(group)) {
            return true;
        }
        return wanted.contains(group);
    }

    private static int scopeRank(String scopeType, UUID scopeId, UUID branchId, UUID departmentId) {
        String scope = normalize(scopeType);
        if ("TENANT".equals(scope)) {
            return 1;
        }
        if ("BRANCH".equals(scope)) {
            return scopeId != null && scopeId.equals(branchId) ? 2 : 0;
        }
        if ("DEPARTMENT".equals(scope)) {
            return scopeId != null && scopeId.equals(departmentId) ? 3 : 0;
        }
        return 0;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private record Candidate(int rank, String group, String approverType, UUID approverId) {

        /** Higher scope rank wins; equal ranks resolve by the alphabetically first group. */
        boolean precedes(Candidate other) {
            if (rank != other.rank) {
                return rank > other.rank;
            }
            return group.compareTo(other.group) < 0;
        }
    }
}
