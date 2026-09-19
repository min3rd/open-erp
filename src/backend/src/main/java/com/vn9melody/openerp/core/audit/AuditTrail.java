package com.vn9melody.openerp.core.audit;

import com.vn9melody.openerp.core.context.SecurityContextService;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.PlatformAction;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import java.util.Map;
import java.util.UUID;

/**
 * Convenience writer for tenant-scoped business audit events (TASK-267/291).
 *
 * <p>Resolves the acting user from the current JWT and forwards the event to every
 * registered {@link AuditRecorder} (the platform {@code AuditLogService} bridge and
 * the no-op fallback), so callers do not repeat the iteration/resolution logic.</p>
 */
@ApplicationScoped
public class AuditTrail {

    @Inject
    Instance<AuditRecorder> recorders;

    @Inject
    SecurityContextService securityContextService;

    public void recordSuccess(UUID tenantId, PlatformAction action, String resourceType, UUID resourceId,
                              Map<String, Object> details) {
        record(tenantId, action, resourceType, resourceId, AuditResult.SUCCESS, details);
    }

    public void recordDenied(UUID tenantId, PlatformAction action, String resourceType, UUID resourceId,
                             Map<String, Object> details) {
        record(tenantId, action, resourceType, resourceId, AuditResult.DENIED, details);
    }

    public void record(UUID tenantId, PlatformAction action, String resourceType, UUID resourceId,
                       AuditResult result, Map<String, Object> details) {
        if (action == null) {
            return;
        }
        UUID actorUserId = currentActorUserId();
        AuditRecorder.AuditEvent event = new AuditRecorder.AuditEvent(
            tenantId, actorUserId, action.name(), resourceType, resourceId, result, details, null);
        for (AuditRecorder recorder : recorders) {
            recorder.record(event);
        }
    }

    /** Acting user id from the bearer token; {@code null} when the caller is anonymous/system. */
    public UUID currentActorUserId() {
        try {
            return securityContextService.currentClaims().userId();
        } catch (Exception e) {
            return null;
        }
    }
}
