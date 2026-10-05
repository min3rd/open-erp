package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Tenant workspace UI preferences (Sprint 04, DES-API-S04-001). */
public record TenantUiPreferencesResponse(
    @JsonProperty("theme") String theme,
    @JsonProperty("available_themes") List<String> availableThemes
) {}
