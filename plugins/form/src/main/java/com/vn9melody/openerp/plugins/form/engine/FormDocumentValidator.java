package com.vn9melody.openerp.plugins.form.engine;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Pure validator for the form document (items array). No DB access so it can be
 * unit tested in isolation. Rules follow DES-ARCH-S08-001 §6 (version semantics)
 * and BENCH-S08-001 §4.4 (forward-only logic, operator bounded by question type).
 */
public final class FormDocumentValidator {

    public static final Set<String> ITEM_TYPES = Set.of(
            "SECTION", "SHORT_TEXT", "LONG_TEXT", "SINGLE_CHOICE", "MULTI_CHOICE",
            "DROPDOWN", "DATE", "NUMBER", "RATING", "FILE_UPLOAD", "MATRIX");

    public static final Set<String> CHOICE_TYPES = Set.of("SINGLE_CHOICE", "MULTI_CHOICE", "DROPDOWN");

    private static final String REF_PATTERN = "[a-zA-Z0-9_-]+";
    private static final Set<String> GOTO_ACTIONS = Set.of("NEXT_SECTION", "SUBMIT_FORM");

    public record Violation(String code, String detail) {}

    private record OptionLogic(int itemIndex, int optionIndex, String action, String gotoRef) {}

    private final List<Violation> violations = new ArrayList<>();
    private final List<OptionLogic> pendingLogic = new ArrayList<>();

    public List<Violation> validate(Map<String, Object> document) {
        violations.clear();
        pendingLogic.clear();
        if (document == null) {
            violations.add(new Violation("FORM_DOCUMENT_INVALID", "document is required"));
            return violations;
        }
        Object itemsObj = document.get("items");
        if (!(itemsObj instanceof List<?> items) || items.isEmpty()) {
            violations.add(new Violation("FORM_DOCUMENT_INVALID", "document.items must be a non-empty array"));
            return violations;
        }

        Set<String> refs = new HashSet<>();
        Map<String, Integer> refIndex = new LinkedHashMap<>();
        for (int i = 0; i < items.size(); i++) {
            if (!(items.get(i) instanceof Map<?, ?> item)) {
                violations.add(new Violation("FORM_DOCUMENT_INVALID", "items[" + i + "] must be an object"));
                continue;
            }
            validateItem(asStringMap(item), i, refs, refIndex);
        }
        // Second pass: logic may only reference items that appear LATER in the form
        // (BENCH-S08-001 §4.4 — skip logic is forward-only).
        for (OptionLogic logic : pendingLogic) {
            Integer targetIndex = logic.gotoRef() == null ? null : refIndex.get(logic.gotoRef());
            if (targetIndex == null || targetIndex <= logic.itemIndex()) {
                violations.add(new Violation("FORM_LOGIC_BACKWARD",
                        "items[" + logic.itemIndex() + "] option " + logic.optionIndex()
                                + " logic must reference a later item"));
            }
        }
        return List.copyOf(violations);
    }

    private void validateItem(Map<String, Object> item, int index, Set<String> refs,
            Map<String, Integer> refIndex) {
        String type = str(item.get("type"));
        if (type == null || !ITEM_TYPES.contains(type)) {
            violations.add(new Violation("FORM_DOCUMENT_INVALID",
                    "items[" + index + "].type '" + type + "' is not supported"));
            return;
        }
        if ("SECTION".equals(type)) {
            if (str(item.get("title")) == null || str(item.get("title")).isBlank()) {
                violations.add(new Violation("FORM_DOCUMENT_INVALID",
                        "items[" + index + "] SECTION requires title"));
            }
            return;
        }
        String ref = str(item.get("ref"));
        if (ref == null || !ref.matches(REF_PATTERN)) {
            violations.add(new Violation("FORM_DOCUMENT_INVALID",
                    "items[" + index + "].ref must match " + REF_PATTERN));
            return;
        }
        if (!refs.add(ref)) {
            violations.add(new Violation("FORM_REF_DUPLICATED", "ref '" + ref + "' is duplicated"));
            return;
        }
        refIndex.put(ref, index);

        if (str(item.get("label")) == null || str(item.get("label")).isBlank()) {
            violations.add(new Violation("FORM_DOCUMENT_INVALID",
                    "items[" + index + "] question '" + ref + "' requires label"));
        }
        if (CHOICE_TYPES.contains(type)) {
            validateOptions(item, index, ref, refIndex);
        }
        if ("MATRIX".equals(type)) {
            if (!(item.get("rows") instanceof List<?> rows) || rows.isEmpty()
                    || !(item.get("columns") instanceof List<?> columns) || columns.isEmpty()) {
                violations.add(new Violation("FORM_DOCUMENT_INVALID",
                        "items[" + index + "] MATRIX requires non-empty rows and columns"));
            }
        }
        if ("FILE_UPLOAD".equals(type) && item.get("file_limits") instanceof Map<?, ?> limits) {
            Object maxFiles = limits.get("max_files");
            if (maxFiles instanceof Number n && n.intValue() < 1) {
                violations.add(new Violation("FORM_DOCUMENT_INVALID",
                        "items[" + index + "] FILE_UPLOAD max_files must be >= 1"));
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void validateOptions(Map<String, Object> item, int index, String ref,
            Map<String, Integer> refIndex) {
        if (!(item.get("options") instanceof List<?> options) || options.isEmpty()) {
            violations.add(new Violation("FORM_DOCUMENT_INVALID",
                    "items[" + index + "] choice '" + ref + "' requires options"));
            return;
        }
        for (int o = 0; o < options.size(); o++) {
            if (!(options.get(o) instanceof Map<?, ?> option)) {
                violations.add(new Violation("FORM_DOCUMENT_INVALID",
                        "items[" + index + "] options[" + o + "] must be an object"));
                continue;
            }
            Map<String, Object> opt = asStringMap(option);
            if (str(opt.get("value")) == null) {
                violations.add(new Violation("FORM_DOCUMENT_INVALID",
                        "items[" + index + "] options[" + o + "] requires value"));
            }
            Object logicObj = opt.get("logic");
            if (logicObj instanceof Map<?, ?> logic) {
                Map<String, Object> logicMap = asStringMap(logic);
                String action = str(logicMap.get("action"));
                String gotoRef = str(logicMap.get("goto_ref"));
                if ("GOTO_REF".equals(action)) {
                    pendingLogic.add(new OptionLogic(index, o, action, gotoRef));
                } else if (!GOTO_ACTIONS.contains(action)) {
                    violations.add(new Violation("FORM_DOCUMENT_INVALID",
                            "items[" + index + "] option " + o + " logic action '" + action + "' is invalid"));
                }
            }
        }
    }

    /**
     * Version-semantics guard (DES-ARCH §6): once a form has responses, refs and
     * their types are immutable. Returns violations comparing old vs new documents.
     */
    public List<Violation> validateRefStability(Map<String, Object> previousDocument,
            Map<String, Object> nextDocument) {
        violations.clear();
        Map<String, String> previousTypes = refTypes(previousDocument);
        Map<String, String> nextTypes = refTypes(nextDocument);
        for (Map.Entry<String, String> entry : previousTypes.entrySet()) {
            String nextType = nextTypes.get(entry.getKey());
            if (nextType == null) {
                continue;
            }
            if (!nextType.equals(entry.getValue())) {
                violations.add(new Violation("FORM_REF_TYPE_IMMUTABLE",
                        "ref '" + entry.getKey() + "' cannot change type from "
                                + entry.getValue() + " to " + nextType + " after publish"));
            }
        }
        return List.copyOf(violations);
    }

    private Map<String, String> refTypes(Map<String, Object> document) {
        Map<String, String> types = new LinkedHashMap<>();
        if (document == null || !(document.get("items") instanceof List<?> items)) {
            return types;
        }
        for (Object itemObj : items) {
            if (itemObj instanceof Map<?, ?> item) {
                Map<String, Object> map = asStringMap(item);
                String ref = str(map.get("ref"));
                String type = str(map.get("type"));
                if (ref != null && type != null) {
                    types.put(ref, type);
                }
            }
        }
        return types;
    }

    private static String str(Object value) {
        return value instanceof String s ? s : null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asStringMap(Map<?, ?> raw) {
        return (Map<String, Object>) raw;
    }
}
