package com.vn9melody.openerp.core.audit;

import com.vn9melody.openerp.core.enums.AuditResult;
import java.util.Map;
import java.util.UUID;

/**
 * Audit recording contract of the Data Permission Enforcement Engine
 * (SOL-02, TASK-267/284).
 *
 * <p>The default CDI bean is a no-op ({@link NoOpAuditRecorder}). The platform
 * audit implementation may be plugged in later by registering another bean of
 * this type; callers iterate all available beans so both implementations stay
 * compatible.</p>
 */
public interface AuditRecorder {

    /**
     * Immutable audit event payload. Keys of {@code details} must use
     * {@link com.vn9melody.openerp.core.enums.ResponseKey} constants.
     */
    record AuditEvent(
        UUID tenantId,
        UUID actorUserId,
        String action,
        String resourceType,
        UUID resourceId,
        AuditResult result,
        Map<String, Object> details,
        String ipAddress
    ) {
        public AuditEvent {
            Map<String, Object> safe = new java.util.LinkedHashMap<>();
            if (details != null) {
                details.forEach((key, value) -> {
                    if (key != null && value != null) {
                        safe.put(key, value);
                    }
                });
            }
            details = Map.copyOf(safe);
            result = result != null ? result : AuditResult.SUCCESS;
        }
    }

    void record(AuditEvent event);

    default void recordDenied(UUID tenantId, UUID actorUserId, String action,
                              String resourceType, UUID resourceId, Map<String, Object> details) {
        record(new AuditEvent(tenantId, actorUserId, action, resourceType, resourceId,
            AuditResult.DENIED, details, null));
    }

    default void recordSuccess(UUID tenantId, UUID actorUserId, String action,
                               String resourceType, UUID resourceId, Map<String, Object> details) {
        record(new AuditEvent(tenantId, actorUserId, action, resourceType, resourceId,
            AuditResult.SUCCESS, details, null));
    }
}
