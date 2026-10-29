package com.vn9melody.openerp.plugins.inappnotification.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.vn9melody.openerp.plugins.inappnotification.model.Notification;
import java.time.Instant;
import java.util.UUID;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record NotificationDto(
        UUID id,
        UUID recipientId,
        String recipientText,
        String title,
        String body,
        String level,
        Instant readAt,
        Instant createdAt) {

    public static NotificationDto from(Notification item) {
        return new NotificationDto(item.id, item.recipientId, item.recipientText,
                item.title, item.body, item.level, item.readAt, item.createdAt);
    }
}
