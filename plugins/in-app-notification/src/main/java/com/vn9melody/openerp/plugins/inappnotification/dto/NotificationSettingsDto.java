package com.vn9melody.openerp.plugins.inappnotification.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.vn9melody.openerp.plugins.inappnotification.model.NotificationSettings;
import java.time.Instant;
import java.util.UUID;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record NotificationSettingsDto(
        UUID id,
        String displayName,
        String supportEmail,
        Boolean channelEmail,
        Boolean channelInApp,
        String levelMin,
        Instant updatedAt) {

    public static NotificationSettingsDto from(NotificationSettings settings) {
        return new NotificationSettingsDto(settings.id, settings.displayName,
                settings.supportEmail, settings.channelEmail, settings.channelInApp,
                settings.levelMin, settings.updatedAt);
    }
}
