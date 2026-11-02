package com.vn9melody.openerp.plugins.workflow.dto;

import com.vn9melody.openerp.plugins.workflow.model.WorkflowDefinition;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@com.fasterxml.jackson.databind.annotation.JsonNaming(com.fasterxml.jackson.databind.PropertyNamingStrategies.SnakeCaseStrategy.class)
public record WorkflowDefinitionDto(
        UUID id,
        String key,
        Integer version,
        String status,
        Map<String, Object> document,
        OffsetDateTime createdAt,
        OffsetDateTime publishedAt) {

    public static WorkflowDefinitionDto from(WorkflowDefinition definition) {
        return new WorkflowDefinitionDto(
                definition.id(),
                definition.key(),
                definition.version(),
                definition.status(),
                definition.document(),
                definition.createdAt(),
                definition.publishedAt());
    }
}
