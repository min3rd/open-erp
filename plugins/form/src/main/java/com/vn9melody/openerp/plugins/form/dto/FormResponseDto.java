package com.vn9melody.openerp.plugins.form.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.vn9melody.openerp.plugins.form.model.FormResponse;
import java.util.Map;
import java.util.UUID;

/** Serialized snake_case per the API contract (DES-API-S08-001). */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record FormResponseDto(
        UUID id,
        UUID formId,
        Integer formVersion,
        Map<String, Object> answers,
        String responderEmail,
        UUID submittedByUserId,
        String entityWriteStatus,
        String entityWriteError,
        String submittedAt) {

    public static FormResponseDto from(FormResponse response) {
        return new FormResponseDto(
                response.id(),
                response.formId(),
                response.formVersion(),
                response.answers(),
                response.responderEmail(),
                response.submittedByUserId(),
                response.entityWriteStatus(),
                response.entityWriteError(),
                response.submittedAt() == null ? null : response.submittedAt().toString());
    }
}
