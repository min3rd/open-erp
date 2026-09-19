package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.modules.platform.model.PlatformAuditLog;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Verifies the SHA-256 audit hash chain for a scope/tenant (TASK-291 / SOL-01 3.3).
 * Recomputes every entry hash from the persisted columns and checks that each
 * {@code prev_hash} matches the previous entry's {@code entry_hash}. Never mutates
 * data: a broken chain is reported, not repaired.
 */
@ApplicationScoped
public class AuditChainVerifier {

    private static final Logger LOG = Logger.getLogger(AuditChainVerifier.class);

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    public AuditChainVerification verify(AuditScope scope, UUID tenantId, Instant from, Instant to) {
        StringBuilder jpql = new StringBuilder(
            "select a from PlatformAuditLog a where a.scope = :scope "
                + "and ((:tenantId is null and a.tenantId is null) or a.tenantId = :tenantId)");
        if (from != null) {
            jpql.append(" and a.createdAt >= :from");
        }
        if (to != null) {
            jpql.append(" and a.createdAt <= :to");
        }
        jpql.append(" order by a.createdAt asc, a.id asc");

        var query = entityManager.createQuery(jpql.toString(), PlatformAuditLog.class)
            .setParameter("scope", scope)
            .setParameter("tenantId", tenantId);
        if (from != null) {
            query.setParameter("from", from);
        }
        if (to != null) {
            query.setParameter("to", to);
        }

        List<PlatformAuditLog> entries = query.getResultList();
        if (entries.isEmpty()) {
            return AuditChainVerification.verified(0);
        }

        String expectedPrev = findPreviousHashBefore(scope, tenantId, entries.get(0));
        long checked = 0;
        for (PlatformAuditLog entry : entries) {
            checked++;
            if (!Objects.equals(entry.prevHash, expectedPrev)) {
                LOG.errorf("Audit chain break at entry %s (event %s): prev_hash=%s expected=%s",
                    entry.id, entry.eventId, entry.prevHash, expectedPrev);
                return AuditChainVerification.tampered(checked, entry.id, entry.eventId, entry.createdAt,
                    "PREV_HASH_MISMATCH");
            }
            String recomputed = computeHash(entry);
            if (!recomputed.equals(entry.entryHash)) {
                LOG.errorf("Audit entry hash mismatch at %s (event %s)", entry.id, entry.eventId);
                return AuditChainVerification.tampered(checked, entry.id, entry.eventId, entry.createdAt,
                    "ENTRY_HASH_MISMATCH");
            }
            expectedPrev = entry.entryHash;
        }
        return AuditChainVerification.verified(checked);
    }

    private String computeHash(PlatformAuditLog entry) {
        AuditLogEntry data = new AuditLogEntry();
        data.scope = entry.scope;
        data.tenantId = entry.tenantId;
        data.actorType = entry.actorType;
        data.actorUserId = entry.actorUserId;
        data.actorEmail = entry.actorEmailSnapshot;
        data.action = entry.action;
        data.resourceType = entry.resourceType;
        data.resourceId = entry.resourceId;
        data.targetTenantId = entry.targetTenantId;
        data.targetUserId = entry.targetUserId;
        data.result = entry.result;
        data.details = entry.details;
        data.ipAddress = entry.ipAddress;
        data.userAgent = entry.userAgent;
        return AuditHashUtil.computeEntryHash(objectMapper, data, entry.eventId, entry.createdAt, entry.prevHash);
    }

    private String findPreviousHashBefore(AuditScope scope, UUID tenantId, PlatformAuditLog first) {
        List<?> rows = entityManager.createNativeQuery("""
                SELECT entry_hash FROM platform_audit_logs
                WHERE scope = :scope AND tenant_id IS NOT DISTINCT FROM :tenantId
                  AND (created_at < :createdAt OR (created_at = :createdAt AND id < :id))
                ORDER BY created_at DESC, id DESC
                LIMIT 1
                """)
            .setParameter("scope", scope.name())
            .setParameter("tenantId", tenantId)
            .setParameter("createdAt", first.createdAt)
            .setParameter("id", first.id)
            .getResultList();
        if (rows.isEmpty() || rows.get(0) == null) {
            return null;
        }
        return rows.get(0).toString();
    }
}
