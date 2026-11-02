package com.vn9melody.openerp.plugins.form.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.event.PluginEventPublisher;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.form.api.FormErrorCode;
import com.vn9melody.openerp.plugins.form.dto.FormResponseDto;
import com.vn9melody.openerp.plugins.form.engine.FormDocumentValidator;
import com.vn9melody.openerp.plugins.form.model.FormDefinition;
import com.vn9melody.openerp.plugins.form.model.FormResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response submission (AC-F06, AC-F13, AC-F14): idempotent insert pinned to the
 * form version, optional entity write through the Core proxy, and an outbox
 * event that triggers the workflow plugin. Version semantics follow
 * DES-ARCH-S08-001 §6 — the response stores the snapshot version it filled.
 */
@ApplicationScoped
public class FormResponseService {

    public static final String EVENT_RESPONSE_SUBMITTED = "form.response.submitted";

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext context;

    @Inject
    EntityWriteProxyClient entityWriteProxyClient;

    @Inject
    PluginEventPublisher eventPublisher;

    public FormResponseDto submit(String formSlug, Map<String, Object> answers,
            String responderEmail, String idempotencyKey, String ipHash,
            String captchaError, UUID authenticatedUserId) {
        FormDefinition form = loadBySlug(formSlug);
        requireAccepting(form);
        requireAnswers(answers, form);

        var existing = client.query("form.response.by_key",
                Map.of("idempotency_key", idempotencyKey)).rows();
        if (!existing.isEmpty()) {
            return FormResponseDto.from(FormResponse.from(existing.get(0)));
        }
        if (captchaError != null) {
            throw new ApiException(400, captchaError, "Captcha verification failed");
        }

        String entityWriteStatus = "SKIPPED";
        String entityWriteError = null;
        Map<String, Object> mapping = form.entityMapping();
        if (mapping != null && !mapping.isEmpty()) {
            var writeResult = writeMappedEntity(form, answers, idempotencyKey);
            entityWriteStatus = writeResult.getKey();
            entityWriteError = writeResult.getValue();
        }

        var result = client.write("form.response.insert", Map.of(
                "form_id", form.id(),
                "form_version", form.latestVersion(),
                "answers", answers,
                "responder_email", responderEmail,
                "submitted_by_user_id", authenticatedUserId,
                "entity_write_status", entityWriteStatus,
                "entity_write_error", entityWriteError,
                "ip_hash", ipHash,
                "idempotency_key", idempotencyKey));
        FormResponse response = FormResponse.from(result.first());

        eventPublisher.publish(EVENT_RESPONSE_SUBMITTED, "FormResponse",
                response.id().toString(),
                Map.of(
                        "response_id", response.id().toString(),
                        "form_id", form.id().toString(),
                        "form_slug", form.slug(),
                        "form_version", response.formVersion(),
                        "responder_email", responderEmail == null ? "" : responderEmail,
                        "answers", answers),
                "form:response:" + response.id());
        return FormResponseDto.from(response);
    }

    public FormResponseDto get(UUID responseId) {
        var rows = client.query("form.response.get", Map.of("id", responseId)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, FormErrorCode.FORM_NOT_FOUND,
                    "Response was not found");
        }
        return FormResponseDto.from(FormResponse.from(rows.get(0)));
    }

    public List<FormResponseDto> list(UUID formId) {
        return client.query("form.response.list", Map.of("form_id", formId)).rows().stream()
                .map(FormResponse::from)
                .map(FormResponseDto::from)
                .toList();
    }

    /** Summary per question ref across versions (AC-F10, DES-ARCH §6.5). */
    public Map<String, Object> summary(UUID formId) {
        List<Map<String, Object>> rows = client.query("form.response.list",
                Map.of("form_id", formId)).rows();
        Map<String, Integer> choiceCounts = new LinkedHashMap<>();
        Map<String, Double> numericSum = new LinkedHashMap<>();
        Map<String, Integer> numericCount = new LinkedHashMap<>();
        int total = rows.size();
        for (Map<String, Object> row : rows) {
            FormResponse response = FormResponse.from(row);
            if (response.answers() == null) {
                continue;
            }
            for (Map.Entry<String, Object> entry : response.answers().entrySet()) {
                Object value = entry.getValue();
                if (value instanceof Number number) {
                    numericSum.merge(entry.getKey(), number.doubleValue(), Double::sum);
                    numericCount.merge(entry.getKey(), 1, Integer::sum);
                } else if (value != null) {
                    choiceCounts.merge(entry.getKey() + ":" + value, 1, Integer::sum);
                }
            }
        }
        Map<String, Object> numericAverages = new LinkedHashMap<>();
        for (String ref : numericSum.keySet()) {
            numericAverages.put(ref, numericSum.get(ref) / numericCount.get(ref));
        }
        return Map.of(
                "total_responses", total,
                "choice_counts", choiceCounts,
                "numeric_averages", numericAverages);
    }

    /** CSV export with columns = union of refs (stable across versions, AC-F11). */
    public String exportCsv(UUID formId) {
        List<Map<String, Object>> rows = client.query("form.response.list",
                Map.of("form_id", formId)).rows();
        java.util.LinkedHashSet<String> refs = new java.util.LinkedHashSet<>();
        List<FormResponse> responses = rows.stream().map(FormResponse::from).toList();
        for (FormResponse response : responses) {
            if (response.answers() != null) {
                refs.addAll(response.answers().keySet());
            }
        }
        StringBuilder csv = new StringBuilder();
        csv.append("response_id,submitted_at,responder_email");
        for (String ref : refs) {
            csv.append(',').append(csvEscape(ref));
        }
        csv.append('\n');
        for (FormResponse response : responses) {
            csv.append(csvEscape(response.id().toString())).append(',')
                    .append(csvEscape(response.submittedAt() == null
                            ? "" : response.submittedAt().toString())).append(',')
                    .append(csvEscape(response.responderEmail() == null
                            ? "" : response.responderEmail()));
            for (String ref : refs) {
                Object value = response.answers() == null ? null : response.answers().get(ref);
                csv.append(',').append(csvEscape(value == null ? "" : String.valueOf(value)));
            }
            csv.append('\n');
        }
        return csv.toString();
    }

    private String csvEscape(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return '"' + value.replace("\"", "\"\"") + '"';
        }
        return value;
    }

    private void requireAccepting(FormDefinition form) {
        if (!"PUBLISHED".equals(form.publishStatus())) {
            throw new ApiException(404, FormErrorCode.FORM_NOT_PUBLISHED,
                    "This form is not accepting responses");
        }
        if (Boolean.FALSE.equals(form.acceptResponses())) {
            throw new ApiException(409, FormErrorCode.FORM_RESPONSE_CLOSED,
                    "This form is closed");
        }
        if (form.closeAt() != null && form.closeAt().isBefore(OffsetDateTime.now())) {
            throw new ApiException(409, FormErrorCode.FORM_RESPONSE_CLOSED,
                    "This form closed at " + form.closeAt());
        }
        if (form.responseLimit() != null && form.responseLimit() > 0) {
            int count = client.query("form.response.count",
                    Map.of("form_id", form.id())).rows().size();
            if (count >= form.responseLimit()) {
                throw new ApiException(409, FormErrorCode.FORM_RESPONSE_CLOSED,
                        "This form reached its response limit");
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void requireAnswers(Map<String, Object> answers, FormDefinition form) {
        if (answers == null) {
            throw new ApiException(400, FormErrorCode.FORM_DOCUMENT_INVALID, "answers are required");
        }
        Map<String, Object> document = form.document();
        if (document != null && document.get("items") instanceof List<?> items) {
            for (Object itemObj : items) {
                if (!(itemObj instanceof Map<?, ?> rawItem)) {
                    continue;
                }
                Map<String, Object> item = (Map<String, Object>) rawItem;
                String type = String.valueOf(item.get("type"));
                if ("SECTION".equals(type)) {
                    continue;
                }
                String ref = String.valueOf(item.get("ref"));
                boolean required = Boolean.TRUE.equals(item.get("required"));
                if (required && (answers.get(ref) == null
                        || "".equals(answers.get(ref)))) {
                    throw new ApiException(400, FormErrorCode.FORM_DOCUMENT_INVALID,
                            "Answer for '" + ref + "' is required");
                }
            }
        }
    }

    /**
     * Mapping shape: {ref: {target_plugin, target_entity, target_field}}. All
     * mapped fields target ONE plugin+entity per form (v1): the first entry
     * decides the target, remaining entries must agree.
     */
    @SuppressWarnings("unchecked")
    private Map.Entry<String, String> writeMappedEntity(FormDefinition form,
            Map<String, Object> answers, String idempotencyKey) {
        String targetPlugin = null;
        String targetEntity = null;
        Map<String, Object> record = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : mappingEntries(form)) {
            String ref = entry.getKey();
            if (!(entry.getValue() instanceof Map<?, ?> rawMapping)) {
                continue;
            }
            Map<String, Object> mapping = (Map<String, Object>) rawMapping;
            String plugin = String.valueOf(mapping.get("target_plugin"));
            String entity = String.valueOf(mapping.get("target_entity"));
            String field = String.valueOf(mapping.get("target_field"));
            if (targetPlugin == null) {
                targetPlugin = plugin;
                targetEntity = entity;
            } else if (!targetPlugin.equals(plugin) || !targetEntity.equals(entity)) {
                return Map.entry("FAILED", "MAPPING_TARGET_MISMATCH");
            }
            Object value = answers.get(ref);
            if (value != null) {
                record.put(field, value);
            }
        }
        if (targetPlugin == null || "null".equals(targetPlugin) || record.isEmpty()) {
            return Map.entry("SKIPPED", (String) null);
        }
        var result = entityWriteProxyClient.write(targetPlugin, targetEntity, record,
                "form:" + idempotencyKey + ":" + targetEntity);
        return result.ok()
                ? Map.entry("OK", (String) null)
                : Map.entry("FAILED", result.error() == null ? "WRITE_FAILED" : result.error());
    }

    @SuppressWarnings("unchecked")
    private Iterable<Map.Entry<String, Object>> mappingEntries(FormDefinition form) {
        Map<String, Object> mapping = form.entityMapping();
        return mapping == null ? Map.<String, Object>of().entrySet() : mapping.entrySet();
    }

    private FormDefinition loadBySlug(String slug) {
        var rows = client.query("form.get_by_slug", Map.of("slug", slug)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, FormErrorCode.FORM_NOT_FOUND, "Form was not found");
        }
        return FormDefinition.from(rows.get(0));
    }
}
