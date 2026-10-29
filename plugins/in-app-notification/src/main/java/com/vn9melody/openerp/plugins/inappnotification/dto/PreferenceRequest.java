package com.vn9melody.openerp.plugins.inappnotification.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record PreferenceRequest(
        boolean channelEmail,
        boolean channelInApp,
        String levelMin) {
}
