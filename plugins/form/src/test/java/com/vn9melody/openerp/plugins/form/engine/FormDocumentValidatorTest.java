package com.vn9melody.openerp.plugins.form.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FormDocumentValidatorTest {

    private final FormDocumentValidator validator = new FormDocumentValidator();

    private Map<String, Object> textQuestion(String ref) {
        return Map.of("type", "SHORT_TEXT", "ref", ref, "label", "Name");
    }

    private Map<String, Object> choiceQuestion(String ref, List<Map<String, Object>> options) {
        return Map.of("type", "SINGLE_CHOICE", "ref", ref, "label", "Pick", "options", options);
    }

    @Test
    void acceptsValidDocument() {
        Map<String, Object> document = Map.of("items", List.of(
                Map.of("type", "SECTION", "title", "Info"),
                textQuestion("name"),
                choiceQuestion("plan", List.of(
                        Map.of("value", "basic"),
                        Map.of("value", "pro", "logic", Map.of("action", "SUBMIT_FORM"))))));
        assertTrue(validator.validate(document).isEmpty());
    }

    @Test
    void rejectsDuplicatedRef() {
        Map<String, Object> document = Map.of("items", List.of(
                textQuestion("name"), textQuestion("name")));
        List<FormDocumentValidator.Violation> violations = validator.validate(document);
        assertEquals(1, violations.size());
        assertEquals("FORM_REF_DUPLICATED", violations.get(0).code());
    }

    @Test
    void rejectsBackwardLogic() {
        Map<String, Object> document = Map.of("items", List.of(
                textQuestion("name"),
                choiceQuestion("plan", List.of(
                        Map.of("value", "basic", "logic", Map.of("action", "GOTO_REF", "goto_ref", "name"))))));
        List<FormDocumentValidator.Violation> violations = validator.validate(document);
        assertEquals(1, violations.size());
        assertEquals("FORM_LOGIC_BACKWARD", violations.get(0).code());
    }

    @Test
    void rejectsForwardLogicOnlyWhenTargetExistsLater() {
        Map<String, Object> document = Map.of("items", List.of(
                choiceQuestion("plan", List.of(
                        Map.of("value", "pro", "logic", Map.of("action", "GOTO_REF", "goto_ref", "billing")))),
                textQuestion("billing")));
        assertTrue(validator.validate(document).isEmpty());
    }

    @Test
    void rejectsUnknownTypeAndBadRef() {
        Map<String, Object> document = Map.of("items", List.of(
                Map.of("type", "VIDEO", "ref", "v", "label", "Video"),
                Map.of("type", "SHORT_TEXT", "ref", "bad ref!", "label", "X")));
        List<FormDocumentValidator.Violation> violations = validator.validate(document);
        assertEquals(2, violations.size());
        assertEquals("FORM_DOCUMENT_INVALID", violations.get(0).code());
    }

    @Test
    void refTypeIsImmutableAfterPublish() {
        Map<String, Object> previous = Map.of("items", List.of(textQuestion("name")));
        Map<String, Object> next = Map.of("items", List.of(
                Map.of("type", "NUMBER", "ref", "name", "label", "Name")));
        List<FormDocumentValidator.Violation> violations =
                validator.validateRefStability(previous, next);
        assertEquals(1, violations.size());
        assertEquals("FORM_REF_TYPE_IMMUTABLE", violations.get(0).code());
    }

    @Test
    void deletingAQuestionKeepsRefStabilityClean() {
        Map<String, Object> previous = Map.of("items", List.of(
                textQuestion("name"), textQuestion("old_field")));
        Map<String, Object> next = Map.of("items", List.of(textQuestion("name")));
        assertTrue(validator.validateRefStability(previous, next).isEmpty());
    }
}
