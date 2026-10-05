package com.vn9melody.openerp.modules.iam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * PUT /api/v1/account/ui-preferences body (Sprint 04, TASK-369). Every field is
 * optional: null (or blank) clears the stored override so the user follows the
 * tenant/default again.
 */
public class UserUiPreferencesUpdateRequest {

    @JsonProperty("theme")
    public String theme;

    @JsonProperty("shape")
    public String shape;

    @JsonProperty("layout")
    public String layout;

    @JsonProperty("mode")
    public String mode;
}
