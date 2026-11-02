package com.vn9melody.openerp.plugins.workflow.engine;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ExpressionEvaluatorTest {

    private Map<String, Object> context(double total) {
        return Map.of(
                "entity", Map.of("total", total, "status", "NEW", "tags", List.of("urgent")),
                "initiator", Map.of("user_id", "u1"),
                "vars", Map.of("vip", true));
    }

    @Test
    void emptyConditionMatchesDefaultBranch() {
        assertTrue(ExpressionEvaluator.evaluate(Map.of(), context(100)));
    }

    @Test
    void comparisonOperatorsEvaluateAgainstEntitySnapshot() {
        Map<String, Object> context = context(15_000_000);
        assertTrue(ExpressionEvaluator.evaluate(
                Map.of("all", List.of(Map.of(
                        "left", Map.of("path", "entity.total"),
                        "op", "GTE",
                        "right", Map.of("value", 10_000_000)))), context));
        assertFalse(ExpressionEvaluator.evaluate(
                Map.of("all", List.of(Map.of(
                        "left", Map.of("path", "entity.total"),
                        "op", "LT",
                        "right", Map.of("value", 10_000_000)))), context));
    }

    @Test
    void andGroupRequiresEveryPredicate() {
        Map<String, Object> condition = Map.of("all", List.of(
                Map.of("left", Map.of("path", "entity.status"), "op", "EQ", "right", Map.of("value", "NEW")),
                Map.of("left", Map.of("path", "vars.vip"), "op", "EQ", "right", Map.of("value", true))));
        assertTrue(ExpressionEvaluator.evaluate(condition, context(1)));

        Map<String, Object> failing = Map.of("all", List.of(
                Map.of("left", Map.of("path", "entity.status"), "op", "EQ", "right", Map.of("value", "NEW")),
                Map.of("left", Map.of("path", "entity.status"), "op", "EQ", "right", Map.of("value", "DONE"))));
        assertFalse(ExpressionEvaluator.evaluate(failing, context(1)));
    }

    @Test
    void orGroupMatchesAnyPredicate() {
        Map<String, Object> condition = Map.of("any", List.of(
                Map.of("left", Map.of("path", "entity.status"), "op", "EQ", "right", Map.of("value", "DONE")),
                Map.of("left", Map.of("path", "entity.tags"), "op", "CONTAINS", "right", Map.of("value", "urgent"))));
        assertTrue(ExpressionEvaluator.evaluate(condition, context(1)));
    }

    @Test
    void unknownOperatorNeverMatches() {
        assertFalse(ExpressionEvaluator.evaluate(
                Map.of("all", List.of(Map.of(
                        "left", Map.of("path", "entity.total"),
                        "op", "SCRIPT",
                        "right", Map.of("value", 1)))), context(1)));
    }

    @Test
    void inOperatorChecksCollectionMembership() {
        assertTrue(ExpressionEvaluator.evaluate(
                Map.of("all", List.of(Map.of(
                        "left", Map.of("path", "entity.status"),
                        "op", "IN",
                        "right", Map.of("value", List.of("NEW", "PENDING"))))), context(1)));
    }
}
