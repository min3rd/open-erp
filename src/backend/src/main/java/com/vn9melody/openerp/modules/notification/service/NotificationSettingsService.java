package com.vn9melody.openerp.modules.notification.service;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.modules.notification.dto.NotificationSettingsDto;
import com.vn9melody.openerp.modules.notification.model.PlatformNotificationSettings;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class NotificationSettingsService {

    private static final Set<String> LEVELS = Set.of("INFO", "WARN", "ERROR");

    public NotificationSettingsDto defaults() {
        PlatformNotificationSettings settings = PlatformNotificationSettings.findById(Boolean.TRUE);
        if (settings == null) {
            throw new ApiException(500, ErrorCode.INTERNAL_SERVER_ERROR,
                    "Platform notification settings are not initialized");
        }
        return NotificationSettingsDto.from(settings);
    }

    @Transactional
    public NotificationSettingsDto saveDefaults(NotificationSettingsDto request, UUID updatedBy) {
        PlatformNotificationSettings settings = PlatformNotificationSettings.findById(Boolean.TRUE);
        if (settings == null) {
            settings = new PlatformNotificationSettings();
            settings.id = Boolean.TRUE;
        }
        if (request == null) {
            throw new ApiException(400, ErrorCode.VALIDATION_FAILED, "Notification settings are required");
        }
        settings.displayName = request.displayName() == null || request.displayName().isBlank()
                ? "Open-ERP"
                : request.displayName().trim();
        settings.supportEmail = request.supportEmail() == null || request.supportEmail().isBlank()
                ? null
                : request.supportEmail().trim();
        settings.channelEmail = request.channelEmail();
        settings.channelInApp = request.channelInApp();
        settings.levelMin = normalizeLevel(request.levelMin());
        settings.updatedAt = Instant.now();
        settings.updatedBy = updatedBy;
        settings.persist();
        return NotificationSettingsDto.from(settings);
    }

    private String normalizeLevel(String level) {
        if (level == null || level.isBlank()) {
            return "INFO";
        }
        String normalized = level.toUpperCase();
        if (!LEVELS.contains(normalized)) {
            throw new ApiException(400, ErrorCode.VALIDATION_FAILED, "level_min must be INFO, WARN or ERROR");
        }
        return normalized;
    }
}
