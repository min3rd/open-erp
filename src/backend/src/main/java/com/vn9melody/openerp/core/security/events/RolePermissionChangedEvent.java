package com.vn9melody.openerp.core.security.events;

import java.util.List;
import java.util.UUID;

public record RolePermissionChangedEvent(
    UUID tenantId,
    UUID roleId,
    List<UUID> affectedUserIds,
    String reason
) implements PermissionInvalidationEvent {
}
