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

    @Test
    void acceptsPageAndStepContainersWithGridResponsiveMetadata() {
        Map<String, Object> document = Map.of(
                "layout", Map.of("mode", "STEP", "columns", 2, "mobile_columns", 1),
                "items", List.of(
                        Map.of("type", "STEP", "title", "Step 1: Identity", "grid_columns", 2, "mobile_columns", 1),
                        Map.of("type", "SHORT_TEXT", "ref", "full_name", "label", "Full Name", "col_span", 1, "mobile_span", 1),
                        choiceQuestion("account_type", List.of(
                                Map.of("value", "personal", "logic", Map.of("action", "NEXT_STEP")),
                                Map.of("value", "enterprise", "logic", Map.of("action", "NEXT_PAGE")))),
                        Map.of("type", "PAGE", "title", "Page 2: Enterprise Details", "grid_columns", 3)));
        assertTrue(validator.validate(document).isEmpty());
    }

    @Test
    void acceptsDynamicChoiceSourcesCatalogAndApi() {
        Map<String, Object> document = Map.of("items", List.of(
                Map.of("type", "SINGLE_CHOICE", "ref", "province", "label", "Province",
                        "option_source", "CATALOG", "catalog_type", "PROVINCE"),
                Map.of("type", "DROPDOWN", "ref", "external_user", "label", "User from API",
                        "option_source", "EXTERNAL_API", "api_url", "https://api.example.com/users")));
        assertTrue(validator.validate(document).isEmpty());
    }

    @Test
    void rejectsDynamicChoiceWithoutRequiredConfiguration() {
        Map<String, Object> document = Map.of("items", List.of(
                Map.of("type", "SINGLE_CHOICE", "ref", "c1", "label", "Bad Catalog",
                        "option_source", "CATALOG"),
                Map.of("type", "DROPDOWN", "ref", "a1", "label", "Bad API",
                        "option_source", "EXTERNAL_API")));
        List<FormDocumentValidator.Violation> violations = validator.validate(document);
        assertEquals(2, violations.size());
    }

    @Test
    void acceptsExcelStyleGridWithColumnsDef() {
        Map<String, Object> document = Map.of("items", List.of(
                Map.of("type", "GRID", "ref", "order_items", "label", "Bảng mặt hàng",
                        "columns_def", List.of(
                                Map.of("key", "item_name", "label", "Tên mặt hàng", "type", "TEXT"),
                                Map.of("key", "qty", "label", "Số lượng", "type", "NUMBER"),
                                Map.of("key", "price", "label", "Đơn giá", "type", "NUMBER"),
                                Map.of("key", "total", "label", "Thành tiền", "type", "FORMULA", "formula", "qty * price", "summary", "SUM")
                        ))));
        assertTrue(validator.validate(document).isEmpty());
    }

    @Test
    void rejectsGridWithoutColumns() {
        Map<String, Object> document = Map.of("items", List.of(
                Map.of("type", "GRID", "ref", "empty_grid", "label", "Bảng trống",
                        "columns", List.of())));
        List<FormDocumentValidator.Violation> violations = validator.validate(document);
        assertEquals(1, violations.size());
        assertEquals("FORM_DOCUMENT_INVALID", violations.get(0).code());
    }

    @Test
    void acceptsAllSixCategoryFieldTypes() {
        Map<String, Object> document = Map.of("items", List.of(
                // 1. Basic Inputs
                Map.of("type", "SHORT_TEXT", "ref", "txt", "label", "Text"),
                Map.of("type", "LONG_TEXT", "ref", "area", "label", "Textarea"),
                Map.of("type", "NUMBER", "ref", "num", "label", "Number"),
                Map.of("type", "PASSWORD", "ref", "pwd", "label", "Password"),
                Map.of("type", "HIDDEN", "ref", "token", "label", "Hidden Token"),
                // 2. Choice & Selection
                Map.of("type", "CHECKBOX", "ref", "agree", "label", "Terms"),
                Map.of("type", "SWITCH", "ref", "dark_mode", "label", "Dark Mode"),
                Map.of("type", "SINGLE_CHOICE", "ref", "radio", "label", "Radio", "options", List.of(Map.of("value", "1"))),
                Map.of("type", "MULTI_CHOICE", "ref", "chk_group", "label", "Checkbox Group", "options", List.of(Map.of("value", "1"))),
                Map.of("type", "DROPDOWN", "ref", "dd", "label", "Dropdown", "options", List.of(Map.of("value", "1"))),
                Map.of("type", "MULTI_SELECT", "ref", "tags", "label", "Tags", "options", List.of(Map.of("value", "1"))),
                // 3. Specialized Inputs
                Map.of("type", "EMAIL", "ref", "email", "label", "Email"),
                Map.of("type", "PHONE", "ref", "phone", "label", "Phone"),
                Map.of("type", "URL", "ref", "website", "label", "Website"),
                Map.of("type", "CURRENCY", "ref", "salary", "label", "Salary"),
                Map.of("type", "DATE", "ref", "birth_date", "label", "Birth Date"),
                Map.of("type", "TIME", "ref", "meeting_time", "label", "Meeting Time"),
                Map.of("type", "DATE_RANGE", "ref", "vacation_period", "label", "Vacation Period"),
                Map.of("type", "COLOR", "ref", "brand_color", "label", "Brand Color"),
                // 4. Media & Upload
                Map.of("type", "FILE_UPLOAD", "ref", "resume", "label", "Resume"),
                Map.of("type", "IMAGE_UPLOAD", "ref", "avatar", "label", "Avatar"),
                Map.of("type", "SIGNATURE", "ref", "contract_sign", "label", "Signature"),
                // 5. Advanced & Interactive
                Map.of("type", "RICH_TEXT", "ref", "cover_letter", "label", "Cover Letter"),
                Map.of("type", "SLIDER", "ref", "satisfaction", "label", "Satisfaction"),
                Map.of("type", "RATING", "ref", "score", "label", "Rating"),
                Map.of("type", "MATRIX", "ref", "feedback_matrix", "label", "Survey Matrix",
                        "rows", List.of("Quality", "Speed"), "columns", List.of("Good", "Bad")),
                Map.of("type", "ADDRESS", "ref", "delivery_addr", "label", "Address"),
                Map.of("type", "GRID", "ref", "order_grid", "label", "Items Grid",
                        "columns_def", List.of(Map.of("key", "k1", "label", "Col 1", "type", "TEXT"))),
                Map.of("type", "REPEATER", "ref", "experiences", "label", "Work Experience"),
                // 6. Layout & Structural
                Map.of("type", "STATIC_TEXT", "ref", "header_note", "content", "Please fill carefully"),
                Map.of("type", "DIVIDER", "ref", "div_1"),
                Map.of("type", "SECTION", "title", "Section 1")
        ));
        assertTrue(validator.validate(document).isEmpty());
    }
}
