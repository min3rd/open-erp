package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.modules.plugin.dto.PluginResponses;
import com.vn9melody.openerp.modules.plugin.model.TenantNotification;
import com.vn9melody.openerp.modules.plugin.repository.TenantNotificationRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * In-app notifications for tenant admins (TASK-311): plugin blocked,
 * forced uninstall, updates and install failures (Gate decision Q3).
 */
@ApplicationScoped
public class PluginNotificationService {

    public static final String TYPE_PLUGIN_BLOCKED = "PLUGIN_BLOCKED";
    public static final String TYPE_PLUGIN_FORCE_UNINSTALLED = "PLUGIN_FORCE_UNINSTALLED";
    public static final String TYPE_PLUGIN_UPDATE_AVAILABLE = "PLUGIN_UPDATE_AVAILABLE";
    public static final String TYPE_PLUGIN_INSTALL_FAILED = "PLUGIN_INSTALL_FAILED";

    @Inject
    TenantNotificationRepository repository;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public void notifyTenant(UUID tenantId, String type, String titleKey, Map<String, Object> params,
                             String severity) {
        TenantNotification notification = new TenantNotification();
        notification.tenantId = tenantId;
        notification.type = type;
        notification.titleCode = titleKey;
        notification.params = objectMapper.valueToTree(params == null ? Map.of() : params);
        notification.severity = severity == null ? "INFO" : severity;
        notification.createdAt = Instant.now();
        repository.persist(notification);
    }

    public List<PluginResponses.NotificationItem> list(UUID tenantId, boolean unreadOnly) {
        List<TenantNotification> rows = unreadOnly
                ? repository.listUnread(tenantId)
                : repository.listByTenant(tenantId);
        return rows.stream().map(this::toItem).toList();
    }

    public long unreadCount(UUID tenantId) {
        return repository.count("tenantId = ?1 and readAt is null", tenantId);
    }

    @Transactional
    public void markRead(UUID tenantId, UUID notificationId) {
        repository.update("readAt = CURRENT_TIMESTAMP where tenantId = ?1 and id = ?2",
                tenantId, notificationId);
    }

    @Transactional
    public void markAllRead(UUID tenantId) {
        repository.markAllRead(tenantId);
    }

    private PluginResponses.NotificationItem toItem(TenantNotification notification) {
        PluginResponses.NotificationItem item = new PluginResponses.NotificationItem();
        item.id = notification.id.toString();
        item.type = notification.type;
        item.titleKey = notification.titleCode;
        item.severity = notification.severity;
        item.readAt = notification.readAt;
        item.createdAt = notification.createdAt;
        return item;
    }
}
