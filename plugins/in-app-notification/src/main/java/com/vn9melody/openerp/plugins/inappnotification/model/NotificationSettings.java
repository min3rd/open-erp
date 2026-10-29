package com.vn9melody.openerp.plugins.inappnotification.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Tenant-level notification settings; null fields inherit platform defaults. */
public class NotificationSettings {

    public UUID id;
    public String displayName;
    public String supportEmail;
    public Boolean channelEmail;
    public Boolean channelInApp;
    public String levelMin;
    public Instant updatedAt;

    public static NotificationSettings from(Map<String, Object> row) {
        NotificationSettings settings = new NotificationSettings();
        settings.id = uuid(row.get("id"));
        settings.displayName = text(row.get("display_name"));
        settings.supportEmail = text(row.get("support_email"));
        settings.channelEmail = row.get("channel_email") == null ? null : bool(row.get("channel_email"));
        settings.channelInApp = row.get("channel_in_app") == null ? null : bool(row.get("channel_in_app"));
        settings.levelMin = text(row.get("level_min"));
        settings.updatedAt = row.get("updated_at") == null ? null : Instant.parse(String.valueOf(row.get("updated_at")));
        return settings;
    }

    private static UUID uuid(Object value) {
        return value == null ? null : UUID.fromString(String.valueOf(value));
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static boolean bool(Object value) {
        return value instanceof Boolean bool ? bool : Boolean.parseBoolean(String.valueOf(value));
    }
}
