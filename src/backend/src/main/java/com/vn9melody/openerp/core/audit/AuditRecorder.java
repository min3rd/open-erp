package com.vn9melody.openerp.core.audit;

import com.vn9melody.openerp.core.enums.AuditResult;
import java.util.Map;
import java.util.UUID;

/**
 * Audit recording contract of the Data Permission Enforcement Engine
 * (SOL-02, TASK-267/284).
 *
 * <p>The single CDI implementation is the platform {@code AuditLogService}
 * bridge; callers inject {@link AuditRecorder} directly.</p>
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
}
