package com.vn9melody.openerp.plugins.inappnotification.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** A notification row; DB access is owned by the core data gateway. */
public class Notification {

    public UUID id;
    public UUID recipientId;
    public String recipientText;
    public String title;
    public String body;
    public String level;
    public Instant readAt;
    public Instant createdAt;

    public static Notification from(Map<String, Object> row) {
        Notification item = new Notification();
        item.id = uuid(row.get("id"));
        item.recipientId = uuid(row.get("recipient_id"));
        item.recipientText = text(row.get("recipient_text"));
        item.title = text(row.get("title"));
        item.body = text(row.get("body"));
        item.level = text(row.get("level"));
        item.readAt = instant(row.get("read_at"));
        item.createdAt = instant(row.get("created_at"));
        return item;
    }

    private static String text(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static UUID uuid(Object value) {
        return value == null ? null : UUID.fromString(String.valueOf(value));
    }

    private static Instant instant(Object value) {
        return value == null ? null : Instant.parse(String.valueOf(value));
    }
}
