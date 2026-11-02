package com.vn9melody.openerp.plugins.form.dto;

import com.vn9melody.openerp.plugins.form.model.FormDefinition;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record FormDefinitionDto(
        UUID id,
        String slug,
        String title,
        String description,
        Map<String, Object> document,
        Map<String, Object> entityMapping,
        String publishStatus,
        String captcha,
        OffsetDateTime closeAt,
        Integer responseLimit,
        Boolean acceptResponses,
        Integer latestVersion,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {

    public static FormDefinitionDto from(FormDefinition definition) {
        return new FormDefinitionDto(
                definition.id(),
                definition.slug(),
                definition.titleText(),
                definition.description(),
                definition.document(),
                definition.entityMapping(),
                definition.publishStatus(),
                definition.captcha(),
                definition.closeAt(),
                definition.responseLimit(),
                definition.acceptResponses(),
                definition.latestVersion(),
                definition.createdAt(),
                definition.updatedAt());
    }
}
