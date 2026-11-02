package com.vn9melody.openerp.plugins.form.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.form.api.FormErrorCode;
import com.vn9melody.openerp.plugins.form.dto.FormDefinitionDto;
import com.vn9melody.openerp.plugins.form.dto.SaveFormRequest;
import com.vn9melody.openerp.plugins.form.engine.FormDocumentValidator;
import com.vn9melody.openerp.plugins.form.model.FormDefinition;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class FormDefinitionService {

    private final FormDocumentValidator validator = new FormDocumentValidator();

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext context;

    public List<FormDefinitionDto> list() {
        return client.query("form.list", Map.of()).rows().stream()
                .map(FormDefinition::from)
                .map(FormDefinitionDto::from)
                .toList();
    }

    public FormDefinitionDto get(UUID id) {
        return FormDefinitionDto.from(load(id));
    }

    public FormDefinitionDto create(SaveFormRequest request) {
        requireTitle(request);
        String slug = requireSlug(request);
        requireDocumentValid(request.document());
        var result = client.write("form.insert", Map.of(
                "slug", slug,
                "title_text", request.title(),
                "description", request.description(),
                "document", request.document(),
                "entity_mapping", request.entityMapping(),
                "publish_status", "DRAFT",
                "latest_version", 1,
                "created_by", context.userId(),
                "updated_at", OffsetDateTime.now()));
        return FormDefinitionDto.from(FormDefinition.from(result.first()));
    }

    public FormDefinitionDto update(UUID id, SaveFormRequest request) {
        requireTitle(request);
        FormDefinition existing = load(id);
        requireDocumentValid(request.document());
        requireRefStability(existing, request.document());

        int nextVersion = existing.latestVersion();
        boolean versioned = existing.publishStatus() != null
                && !"DRAFT".equals(existing.publishStatus());
        if (versioned) {
            nextVersion = existing.latestVersion() + 1;
            client.write("form.version.insert", Map.of(
                    "definition_id", existing.id(),
                    "version", nextVersion,
                    "document", request.document(),
                    "entity_mapping", request.entityMapping()));
        }
        client.write("form.update", Map.of(
                "id", existing.id(),
                "title_text", request.title(),
                "description", request.description(),
                "document", request.document(),
                "entity_mapping", request.entityMapping(),
                "latest_version", nextVersion,
                "updated_at", OffsetDateTime.now()));
        return get(id);
    }

    public void delete(UUID id) {
        FormDefinition existing = load(id);
        if (!"DRAFT".equals(existing.publishStatus())) {
            throw new ApiException(409, FormErrorCode.FORM_DELETE_BLOCKED,
                    "Only DRAFT forms can be deleted; close the form instead");
        }
        // Descriptor-level delete is added with response service (FEAT-39 task list).
    }

    public FormDefinitionDto publish(UUID id, String captcha, OffsetDateTime closeAt,
            Integer responseLimit) {
        FormDefinition existing = load(id);
        if ("CLOSED".equals(existing.publishStatus())) {
            throw new ApiException(409, FormErrorCode.FORM_DOCUMENT_INVALID,
                    "CLOSED forms cannot be republished; edit and publish a new version");
        }
        Map<String, Object> params = new HashMap<>();
        params.put("id", existing.id());
        params.put("publish_status", "PUBLISHED");
        params.put("captcha", captcha == null ? existing.captcha() : captcha);
        params.put("close_at", closeAt);
        params.put("response_limit", responseLimit);
        params.put("accept_responses", true);
        params.put("updated_at", OffsetDateTime.now());
        client.write("form.publish", params);
        return get(id);
    }

    public FormDefinitionDto close(UUID id) {
        FormDefinition existing = load(id);
        client.write("form.publish", Map.of(
                "id", existing.id(),
                "publish_status", "CLOSED",
                "accept_responses", false,
                "updated_at", OffsetDateTime.now()));
        return get(id);
    }

    private FormDefinition load(UUID id) {
        var rows = client.query("form.get", Map.of("id", id)).rows();
        if (rows.isEmpty()) {
            throw new ApiException(404, FormErrorCode.FORM_NOT_FOUND, "Form was not found");
        }
        return FormDefinition.from(rows.get(0));
    }

    private void requireTitle(SaveFormRequest request) {
        if (request == null || request.title() == null || request.title().isBlank()) {
            throw new ApiException(400, FormErrorCode.FORM_TITLE_REQUIRED, "title is required");
        }
    }

    private String requireSlug(SaveFormRequest request) {
        if (request.slug() == null || request.slug().isBlank()) {
            throw new ApiException(400, FormErrorCode.FORM_SLUG_REQUIRED, "slug is required");
        }
        return request.slug().trim().toLowerCase();
    }

    private void requireDocumentValid(Map<String, Object> document) {
        List<FormDocumentValidator.Violation> violations = validator.validate(document);
        if (!violations.isEmpty()) {
            FormDocumentValidator.Violation first = violations.get(0);
            throw new ApiException(400, first.code(), first.detail());
        }
    }

    private void requireRefStability(FormDefinition existing, Map<String, Object> nextDocument) {
        List<FormDocumentValidator.Violation> violations =
                validator.validateRefStability(existing.document(), nextDocument);
        if (!violations.isEmpty()) {
            FormDocumentValidator.Violation first = violations.get(0);
            throw new ApiException(409, first.code(), first.detail());
        }
    }
}
