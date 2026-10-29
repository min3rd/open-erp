package com.vn9melody.openerp.modules.notification.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.vn9melody.openerp.modules.notification.model.PlatformNotificationSettings;
import java.time.Instant;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record NotificationSettingsDto(
        String displayName,
        String supportEmail,
        boolean channelEmail,
        boolean channelInApp,
        String levelMin,
        Instant updatedAt) {

    public static NotificationSettingsDto from(PlatformNotificationSettings settings) {
        return new NotificationSettingsDto(
                settings.displayName,
                settings.supportEmail,
                settings.channelEmail,
                settings.channelInApp,
                settings.levelMin,
                settings.updatedAt);
    }
}
