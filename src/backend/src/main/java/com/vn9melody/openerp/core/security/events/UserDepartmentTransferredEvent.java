package com.vn9melody.openerp.core.security.events;

import java.util.List;
import java.util.UUID;

public record UserDepartmentTransferredEvent(
    UUID tenantId,
    UUID userId,
    UUID fromDepartmentId,
    UUID toDepartmentId,
    String reason
) implements PermissionInvalidationEvent {

    @Override
    public List<UUID> affectedUserIds() {
        return userId != null ? List.of(userId) : List.of();
    }
}
