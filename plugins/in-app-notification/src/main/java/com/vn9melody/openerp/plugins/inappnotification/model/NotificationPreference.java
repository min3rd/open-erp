package com.vn9melody.openerp.plugins.inappnotification.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class NotificationPreference {

    public UUID id;
    public UUID userId;
    public boolean channelEmail;
    public boolean channelInApp;
    public String levelMin;
    public Instant updatedAt;

    public static NotificationPreference from(Map<String, Object> row) {
        NotificationPreference preference = new NotificationPreference();
        preference.id = uuid(row.get("id"));
        preference.userId = uuid(row.get("user_id"));
        preference.channelEmail = bool(row.get("channel_email"));
        preference.channelInApp = row.get("channel_in_app") == null || bool(row.get("channel_in_app"));
        preference.levelMin = row.get("level_min") == null ? "INFO" : String.valueOf(row.get("level_min"));
        preference.updatedAt = row.get("updated_at") == null ? null : Instant.parse(String.valueOf(row.get("updated_at")));
        return preference;
    }

    private static UUID uuid(Object value) {
        return value == null ? null : UUID.fromString(String.valueOf(value));
    }

    private static boolean bool(Object value) {
        return value instanceof Boolean bool ? bool : Boolean.parseBoolean(String.valueOf(value));
    }
}
