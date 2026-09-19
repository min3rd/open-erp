package com.vn9melody.openerp.core.security.events;

import java.util.List;
import java.util.UUID;

/**
 * Contract for events that invalidate the cached security context
 * (sec:ctx:{tenant_id}:{user_id}) of one or more users.
 */
public interface PermissionInvalidationEvent {

    UUID tenantId();

    List<UUID> affectedUserIds();

    String reason();
}
