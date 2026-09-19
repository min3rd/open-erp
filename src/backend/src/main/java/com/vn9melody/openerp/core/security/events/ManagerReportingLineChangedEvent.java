package com.vn9melody.openerp.core.security.events;

import java.util.List;
import java.util.UUID;

public record ManagerReportingLineChangedEvent(
    UUID tenantId,
    UUID managerUserId,
    List<UUID> affectedUserIds,
    String reason
) implements PermissionInvalidationEvent {
}
