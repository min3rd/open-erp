package com.vn9melody.openerp.plugins.inappnotification.service;

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import com.vn9melody.openerp.plugin.sdk.runtime.TenantContext;
import com.vn9melody.openerp.plugins.inappnotification.api.NotificationErrorCode;
import com.vn9melody.openerp.plugins.inappnotification.dto.CreateNotificationRequest;
import com.vn9melody.openerp.plugins.inappnotification.dto.NotificationDto;
import com.vn9melody.openerp.plugins.inappnotification.dto.NotificationPreferenceDto;
import com.vn9melody.openerp.plugins.inappnotification.dto.NotificationSettingsDto;
import com.vn9melody.openerp.plugins.inappnotification.dto.PreferenceRequest;
import com.vn9melody.openerp.plugins.inappnotification.dto.SaveNotificationSettingsRequest;
import com.vn9melody.openerp.plugins.inappnotification.model.Notification;
import com.vn9melody.openerp.plugins.inappnotification.model.NotificationPreference;
import com.vn9melody.openerp.plugins.inappnotification.model.NotificationSettings;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class NotificationService {

    private static final Set<String> LEVELS = Set.of("INFO", "WARN", "ERROR");

    @Inject
    PluginDataClient client;

    @Inject
    TenantContext context;

    public List<NotificationDto> listMine() {
        UUID userId = requireUser();
        return client.query("notification.list", Map.of("recipient_id", userId)).rows().stream()
                .map(Notification::from)
                .map(NotificationDto::from)
                .toList();
    }

    public NotificationDto create(CreateNotificationRequest request) {
        if (request == null || request.recipientId() == null) {
            throw new ApiException(400, NotificationErrorCode.NOTIFICATION_RECIPIENT_REQUIRED,
                    "recipient_id is required");
        }
        if (request.title() == null || request.title().isBlank()) {
            throw new ApiException(400, NotificationErrorCode.NOTIFICATION_TITLE_REQUIRED,
                    "title is required");
        }
        String level = normalizeLevel(request.level());
        Map<String, Object> params = new HashMap<>();
        params.put("recipient_id", request.recipientId());
        params.put("recipient_text", request.recipientText() == null ? "" : request.recipientText());
        params.put("title", request.title());
        params.put("body", request.body());
        params.put("level", level);
        params.put("read_at", null);
        var result = client.write("notification.create", params);
        return NotificationDto.from(Notification.from(result.first()));
    }

    public int markRead(UUID id) {
        UUID userId = requireUser();
        var result = client.write("notification.read", Map.of(
                "id", id,
                "recipient_id", userId,
                "read_at", Instant.now()));
        if (result.affectedRows() == 0) {
            throw new ApiException(404, NotificationErrorCode.NOTIFICATION_NOT_FOUND,
                    "Notification was not found for this user");
        }
        return (int) result.affectedRows();
    }

    public int markAllRead() {
        UUID userId = requireUser();
        var result = client.write("notification.read.all", Map.of(
                "recipient_id", userId,
                "read_at", Instant.now()));
        return (int) result.affectedRows();
    }

    public NotificationPreferenceDto preferences() {
        UUID userId = requireUser();
        return currentPreference(userId)
                .map(NotificationPreferenceDto::from)
                .orElseGet(() -> new NotificationPreferenceDto(null, userId, false, true, "INFO", null));
    }

    public NotificationPreferenceDto savePreferences(PreferenceRequest request) {
        UUID userId = requireUser();
        String level = normalizeLevel(request == null ? null : request.levelMin());
        boolean email = request != null && request.channelEmail();
        boolean inApp = request == null || request.channelInApp();
        Instant now = Instant.now();

        if (currentPreference(userId).isPresent()) {
            var result = client.write("preference.update", Map.of(
                    "user_id", userId,
                    "channel_email", email,
                    "channel_in_app", inApp,
                    "level_min", level,
                    "updated_at", now));
            return NotificationPreferenceDto.from(NotificationPreference.from(result.first()));
        }
        var result = client.write("preference.insert", Map.of(
                "user_id", userId,
                "channel_email", email,
                "channel_in_app", inApp,
                "level_min", level,
                "updated_at", now));
        return NotificationPreferenceDto.from(NotificationPreference.from(result.first()));
    }

    public NotificationSettingsDto settings() {
        List<Map<String, Object>> rows = client.query("settings.get",
                Map.of("scope", "TENANT")).rows();
        return rows.isEmpty()
                ? new NotificationSettingsDto(null, null, null, null, null, null, null)
                : NotificationSettingsDto.from(NotificationSettings.from(rows.get(0)));
    }

    public NotificationSettingsDto saveSettings(SaveNotificationSettingsRequest request) {
        String level = request == null || request.levelMin() == null || request.levelMin().isBlank()
                ? null : normalizeLevel(request.levelMin());
        Map<String, Object> values = new HashMap<>();
        values.put("scope", "TENANT");
        values.put("display_name", blankToNull(request == null ? null : request.displayName()));
        values.put("support_email", blankToNull(request == null ? null : request.supportEmail()));
        values.put("channel_email", request == null ? null : request.channelEmail());
        values.put("channel_in_app", request == null ? null : request.channelInApp());
        values.put("level_min", level);
        values.put("updated_at", Instant.now());

        List<Map<String, Object>> rows = client.query("settings.get",
                Map.of("scope", "TENANT")).rows();
        var result = rows.isEmpty()
                ? client.write("settings.insert", values)
                : client.write("settings.update", values);
        return NotificationSettingsDto.from(NotificationSettings.from(result.first()));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private java.util.Optional<NotificationPreference> currentPreference(UUID userId) {
        List<Map<String, Object>> rows = client.query("preference.get",
                Map.of("user_id", userId)).rows();
        return rows.isEmpty()
                ? java.util.Optional.empty()
                : java.util.Optional.of(NotificationPreference.from(rows.get(0)));
    }

    private UUID requireUser() {
        UUID userId = context.userId();
        if (userId == null) {
            throw new ApiException(401, NotificationErrorCode.NOTIFICATION_FORBIDDEN,
                    "Authenticated user is required");
        }
        return userId;
    }

    private String normalizeLevel(String level) {
        if (level == null || level.isBlank()) {
            return "INFO";
        }
        String normalized = level.toUpperCase();
        if (!LEVELS.contains(normalized)) {
            throw new ApiException(400, NotificationErrorCode.NOTIFICATION_LEVEL_INVALID,
                    "level must be INFO, WARN or ERROR");
        }
        return normalized;
    }
}
