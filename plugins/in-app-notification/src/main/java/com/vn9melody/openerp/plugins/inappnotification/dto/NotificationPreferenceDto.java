package com.vn9melody.openerp.plugins.inappnotification.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.vn9melody.openerp.plugins.inappnotification.model.NotificationPreference;
import java.time.Instant;
import java.util.UUID;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record NotificationPreferenceDto(
        UUID id,
        UUID userId,
        boolean channelEmail,
        boolean channelInApp,
        String levelMin,
        Instant updatedAt) {

    public static NotificationPreferenceDto from(NotificationPreference preference) {
        return new NotificationPreferenceDto(preference.id, preference.userId,
                preference.channelEmail, preference.channelInApp,
                preference.levelMin, preference.updatedAt);
    }
}
