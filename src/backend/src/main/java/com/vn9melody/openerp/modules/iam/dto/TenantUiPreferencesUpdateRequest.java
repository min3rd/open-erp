package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

/** PUT /api/v1/tenant/ui-preferences body (Sprint 04, TASK-357). */
public class TenantUiPreferencesUpdateRequest {

    @NotBlank
    @JsonProperty("theme")
    public String theme;
}
