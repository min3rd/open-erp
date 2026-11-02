package com.vn9melody.openerp.plugins.workflow.engine;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Small, safe condition DSL for branch evaluation (BR-W08): comparisons only,
 * AND/OR one nesting level, evaluated against a read-only context
 * {entity, initiator, vars, previous_node_result}. No arbitrary code execution.
 */
public final class ExpressionEvaluator {

    public static final Set<String> OPERATORS = Set.of(
            "EQ", "NEQ", "GT", "GTE", "LT", "LTE", "IN", "CONTAINS");

    private ExpressionEvaluator() {}

    /**
     * Condition shape:
     * {@code {all: [ {left, op, right} ... ], any: [ {left, op, right} ... ]}}
     * — empty {@code all} matches (default branch).
     */
    public static boolean evaluate(Map<String, Object> condition, Map<String, Object> context) {
        if (condition == null || condition.isEmpty()) {
            return true;
        }
        if (!evalGroup(asList(condition.get("all")), context, true)) {
            return false;
        }
        return evalGroup(asList(condition.get("any")), context, false);
    }

    private static boolean evalGroup(List<Map<String, Object>> predicates,
            Map<String, Object> context, boolean requireAll) {
        if (predicates.isEmpty()) {
            return true;
        }
        boolean result = requireAll;
        for (Map<String, Object> predicate : predicates) {
            boolean matched = evaluatePredicate(predicate, context);
            if (requireAll) {
                result = result && matched;
            } else {
                result = result || matched;
            }
        }
        return result;
    }

    public static boolean evaluatePredicate(Map<String, Object> predicate, Map<String, Object> context) {
        String op = str(predicate.get("op"));
        if (!OPERATORS.contains(op)) {
            return false;
        }
        Object left = resolve(predicate.get("left"), context);
        Object right = resolve(predicate.get("right"), context);
        return switch (op) {
            case "EQ" -> equalsValue(left, right);
            case "NEQ" -> !equalsValue(left, right);
            case "GT", "GTE", "LT", "LTE" -> compare(left, right, op);
            case "IN" -> right instanceof Collection<?> c && c.contains(left);
            case "CONTAINS" -> contains(left, right);
            default -> false;
        };
    }

    /** left can be a literal or a dotted path into the context (entity.total, vars.x). */
    private static Object resolve(Object operand, Map<String, Object> context) {
        if (!(operand instanceof Map<?, ?> ref)) {
            return operand;
        }
        Object path = ref.get("path");
        if (path == null) {
            return ref.get("value");
        }
        Object current = context;
        for (String part : path.toString().split("\\.")) {
            if (!(current instanceof Map<?, ?> map)) {
                return null;
            }
            current = map.get(part);
        }
        return current;
    }

    private static boolean equalsValue(Object left, Object right) {
        if (left instanceof Number ln && right instanceof Number rn) {
            return ln.doubleValue() == rn.doubleValue();
        }
        return left == null ? right == null : left.equals(right);
    }

    private static boolean compare(Object left, Object right, String op) {
        if (!(left instanceof Number ln) || !(right instanceof Number rn)) {
            return false;
        }
        double l = ln.doubleValue();
        double r = rn.doubleValue();
        return switch (op) {
            case "GT" -> l > r;
            case "GTE" -> l >= r;
            case "LT" -> l < r;
            case "LTE" -> l <= r;
            default -> false;
        };
    }

    private static boolean contains(Object left, Object right) {
        if (left instanceof Collection<?> c) {
            return c.contains(right);
        }
        return left != null && left.toString().contains(right == null ? "" : right.toString());
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> asList(Object raw) {
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        return list.stream()
                .filter(p -> p instanceof Map<?, ?>)
                .map(p -> (Map<String, Object>) p)
                .toList();
    }

    private static String str(Object value) {
        return value instanceof String s ? s : null;
    }
}
