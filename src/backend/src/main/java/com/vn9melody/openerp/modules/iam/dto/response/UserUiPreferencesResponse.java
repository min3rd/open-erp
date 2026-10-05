package com.vn9melody.openerp.modules.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Per-user UI preferences (Sprint 04, TASK-369). */
public record UserUiPreferencesResponse(
    @JsonProperty("theme") String theme,
    @JsonProperty("shape") String shape,
    @JsonProperty("layout") String layout,
    @JsonProperty("mode") String mode,
    @JsonProperty("tenant_theme") String tenantTheme,
    @JsonProperty("available_themes") List<String> availableThemes,
    @JsonProperty("available_shapes") List<String> availableShapes,
    @JsonProperty("available_layouts") List<String> availableLayouts,
    @JsonProperty("available_modes") List<String> availableModes
) {}
