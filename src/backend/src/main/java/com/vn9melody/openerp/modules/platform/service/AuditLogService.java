package com.vn9melody.openerp.modules.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.audit.AuditRecorder;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.modules.platform.model.PlatformAuditLog;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Single write path for the immutable audit trail (SOL-01 sections 3.2/3.3/3.5).
 *
 * <p>Every entry is inserted inside the caller transaction (propagation REQUIRED)
 * so a failed audit write rolls the business change back (fail-closed). The
 * SHA-256 hash chain is serialized with a PostgreSQL transaction-scoped advisory
 * lock, one chain per scope/tenant.</p>
 */
@ApplicationScoped
public class AuditLogService implements AuditRecorder {

    private static final Logger LOG = Logger.getLogger(AuditLogService.class);

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public PlatformAuditLog record(AuditLogEntry entry) {
        if (entry.action == null || entry.action.isBlank()) {
            throw new IllegalArgumentException("Audit action is required");
        }
        if (entry.scope == null) {
            entry.scope = AuditScope.PLATFORM;
        }
        if (entry.actorType == null) {
            entry.actorType = ActorType.USER;
        }
        if (entry.result == null) {
            entry.result = AuditResult.SUCCESS;
        }
        if (entry.scope == AuditScope.TENANT && entry.tenantId == null) {
            throw new IllegalArgumentException("TENANT scope audit entries require tenant_id");
        }

        UUID eventId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        JsonNode details = normalizeDetails(entry);

        String actorEmail = resolveActorEmail(entry);

        acquireChainLock(entry.scope, entry.tenantId);
        ChainTail tail = findChainTail(entry.scope, entry.tenantId);
        String prevHash = tail != null ? tail.entryHash() : null;
        // Strictly increasing (created_at, id) ordering keeps the chain deterministic
        // even when two entries land in the same microsecond.
        Instant createdAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
        if (tail != null && tail.createdAt() != null && !createdAt.isAfter(tail.createdAt())) {
            createdAt = tail.createdAt().plusNanos(1000);
        }
        String entryHash = AuditHashUtil.computeEntryHash(objectMapper, entry, eventId, createdAt, prevHash);

        entityManager.createNativeQuery("""
                INSERT INTO platform_audit_logs
                    (id, event_id, scope, tenant_id, actor_user_id, actor_type, actor_email_snapshot, action,
                     resource_type, resource_id, target_tenant_id, target_user_id, result, correlation_id,
                     details, ip_address, user_agent, prev_hash, entry_hash, created_at)
                VALUES
                    (:id, :eventId, :scope, :tenantId, :actorUserId, :actorType, :actorEmail, :action,
                     :resourceType, :resourceId, :targetTenantId, :targetUserId, :result, :correlationId,
                     CAST(:details AS jsonb), :ipAddress, :userAgent, :prevHash, :entryHash, :createdAt)
                """)
            .setParameter("id", id)
            .setParameter("eventId", eventId)
            .setParameter("scope", entry.scope.name())
            .setParameter("tenantId", entry.tenantId)
            .setParameter("actorUserId", entry.actorUserId)
            .setParameter("actorType", entry.actorType.name())
            .setParameter("actorEmail", actorEmail)
            .setParameter("action", entry.action)
            .setParameter("resourceType", entry.resourceType)
            .setParameter("resourceId", entry.resourceId)
            .setParameter("targetTenantId", entry.targetTenantId)
            .setParameter("targetUserId", entry.targetUserId)
            .setParameter("result", entry.result.name())
            .setParameter("correlationId", entry.correlationId)
            .setParameter("details", details.toString())
            .setParameter("ipAddress", entry.ipAddress != null ? entry.ipAddress : "unknown")
            .setParameter("userAgent", entry.userAgent)
            .setParameter("prevHash", prevHash)
            .setParameter("entryHash", entryHash)
            .setParameter("createdAt", createdAt)
            .executeUpdate();

        PlatformAuditLog log = new PlatformAuditLog();
        log.id = id;
        log.eventId = eventId;
        log.scope = entry.scope;
        log.tenantId = entry.tenantId;
        log.actorUserId = entry.actorUserId;
        log.actorType = entry.actorType;
        log.actorEmailSnapshot = actorEmail;
        log.action = entry.action;
        log.resourceType = entry.resourceType;
        log.resourceId = entry.resourceId;
        log.targetTenantId = entry.targetTenantId;
        log.targetUserId = entry.targetUserId;
        log.result = entry.result;
        log.correlationId = entry.correlationId;
        log.details = details;
        log.ipAddress = entry.ipAddress != null ? entry.ipAddress : "unknown";
        log.userAgent = entry.userAgent;
        log.prevHash = prevHash;
        log.entryHash = entryHash;
        log.createdAt = createdAt;
        return log;
    }

    /** Convenience overload matching the TASK-291 contract. */
    @Transactional
    public PlatformAuditLog record(AuditScope scope, UUID tenantId, ActorType actorType, UUID actorUserId,
                                   String action, AuditResult result, JsonNode details, String reason,
                                   String ipAddress, String userAgent) {
        AuditLogEntry entry = AuditLogEntry.of(scope, tenantId, actorType, actorUserId, action, result)
            .details(details)
            .reason(reason)
            .client(ipAddress, userAgent);
        return record(entry);
    }

    /**
     * Bridge from the Data Permission Enforcement Engine (TASK-267/284) so tenant
     * permission/quota events land in the same immutable, hash-chained trail.
     * Disabled in the test profile to keep the shared test database clean (other
     * suites delete users in their fixtures and the audit FK is restrictive).
     */
    @Override
    @Transactional
    public void record(AuditRecorder.AuditEvent event) {
        if (!recorderEnabled()) {
            LOG.debugf("Audit recorder disabled by config; skipping event %s", event.action());
            return;
        }
        AuditScope scope = event.tenantId() != null ? AuditScope.TENANT : AuditScope.PLATFORM;
        UUID actorUserId = resolveFallbackActor(scope, event.tenantId(), event.actorUserId());
        if (actorUserId == null) {
            LOG.warnf("No actor available for audit event %s; entry skipped", event.action());
            return;
        }
        AuditLogEntry entry = AuditLogEntry.of(scope, event.tenantId(), ActorType.USER, actorUserId,
            event.action(), event.result());
        entry.resource(event.resourceType(), event.resourceId());
        entry.client(event.ipAddress(), null);
        if (event.details() != null && !event.details().isEmpty()) {
            entry.details(objectMapper.valueToTree(event.details()));
        }
        record(entry);
    }

    private boolean recorderEnabled() {
        return org.eclipse.microprofile.config.ConfigProvider.getConfig()
            .getOptionalValue("openerp.platform.audit.recorder-enabled", Boolean.class)
            .orElse(true);
    }

    private UUID resolveFallbackActor(AuditScope scope, UUID tenantId, UUID actorUserId) {
        if (actorUserId != null) {
            return actorUserId;
        }
        if (scope == AuditScope.TENANT && tenantId != null) {
            List<?> members = entityManager.createNativeQuery("""
                    SELECT user_id FROM user_tenants WHERE tenant_id = :tenantId
                    ORDER BY CASE WHEN role IN ('TENANT_ADMIN', 'ADMIN', 'OWNER') THEN 0 ELSE 1 END,
                             joined_at ASC
                    LIMIT 1
                    """).setParameter("tenantId", tenantId).getResultList();
            if (!members.isEmpty() && members.get(0) != null) {
                return UUID.fromString(members.get(0).toString());
            }
        }
        List<?> admins = entityManager.createNativeQuery(
                "SELECT user_id FROM platform_super_admins WHERE status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1")
            .getResultList();
        if (!admins.isEmpty() && admins.get(0) != null) {
            return UUID.fromString(admins.get(0).toString());
        }
        return null;
    }

    private JsonNode normalizeDetails(AuditLogEntry entry) {
        ObjectNode node;
        if (entry.details != null && entry.details.isObject()) {
            node = (ObjectNode) entry.details;
        } else {
            node = objectMapper.createObjectNode();
            if (entry.details != null) {
                node.set("value", entry.details);
            }
        }
        if (entry.reason != null && !entry.reason.isBlank()) {
            node.put("reason", entry.reason);
        }
        return node;
    }

    private String resolveActorEmail(AuditLogEntry entry) {
        if (entry.actorEmail != null && !entry.actorEmail.isBlank()) {
            return entry.actorEmail;
        }
        if (entry.actorUserId != null) {
            try {
                List<?> rows = entityManager.createNativeQuery("SELECT email FROM users WHERE id = :id")
                    .setParameter("id", entry.actorUserId)
                    .getResultList();
                if (!rows.isEmpty() && rows.get(0) != null) {
                    return rows.get(0).toString();
                }
            } catch (Exception e) {
                LOG.debugf("Could not resolve audit actor email for %s: %s", entry.actorUserId, e.getMessage());
            }
        }
        return switch (entry.actorType) {
            case SYSTEM -> "system@openerp.local";
            case CLI -> "cli@openerp.local";
            default -> "unknown@openerp.local";
        };
    }

    private void acquireChainLock(AuditScope scope, UUID tenantId) {
        long lockKey = chainLockKey(scope, tenantId);
        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(:key)")
            .setParameter("key", lockKey)
            .getResultList();
    }

    private record ChainTail(String entryHash, Instant createdAt) {}

    private ChainTail findChainTail(AuditScope scope, UUID tenantId) {
        List<?> rows = entityManager.createNativeQuery("""
                SELECT entry_hash, created_at FROM platform_audit_logs
                WHERE scope = :scope AND tenant_id IS NOT DISTINCT FROM :tenantId
                ORDER BY created_at DESC, id DESC
                LIMIT 1
                """)
            .setParameter("scope", scope.name())
            .setParameter("tenantId", tenantId)
            .getResultList();
        if (rows.isEmpty()) {
            return null;
        }
        Object row = rows.get(0);
        if (row instanceof Object[] values) {
            String hash = values[0] != null ? values[0].toString() : null;
            Instant createdAt = values[1] instanceof Instant instant ? instant : null;
            return new ChainTail(hash, createdAt);
        }
        return new ChainTail(row != null ? row.toString() : null, null);
    }

    static long chainLockKey(AuditScope scope, UUID tenantId) {
        if (scope == AuditScope.TENANT && tenantId != null) {
            return tenantId.getMostSignificantBits() ^ tenantId.getLeastSignificantBits() ^ 0x54454E414E54L;
        }
        return 0x504C4154464F524DL;
    }

    // ------------------------------------------------------------------
    // Read path (DES-02-API 3.7 / BUG-72)
    // ------------------------------------------------------------------

    public com.vn9melody.openerp.modules.platform.dto.PlatformPage<
            com.vn9melody.openerp.modules.platform.dto.PlatformResponses.AuditLogItem> listAuditLogs(
            AuditScope scope, UUID tenantId, String action, String result, UUID actorUserId,
            String resourceType, Instant from, Instant to, String keyword, int page, int size) {

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        Map<String, Object> params = new HashMap<>();
        if (scope != null) {
            where.append(" AND a.scope = :scope");
            params.put("scope", scope.name());
        }
        if (tenantId != null) {
            where.append(" AND (a.tenant_id = :tenantId OR a.target_tenant_id = :tenantId)");
            params.put("tenantId", tenantId);
        }
        if (action != null && !action.isBlank()) {
            where.append(" AND a.action = :action");
            params.put("action", action.trim());
        }
        if (result != null && !result.isBlank()) {
            where.append(" AND a.result = :result");
            params.put("result", result.trim().toUpperCase());
        }
        if (actorUserId != null) {
            where.append(" AND a.actor_user_id = :actorUserId");
            params.put("actorUserId", actorUserId);
        }
        if (resourceType != null && !resourceType.isBlank()) {
            where.append(" AND a.resource_type = :resourceType");
            params.put("resourceType", resourceType.trim());
        }
        if (from != null) {
            where.append(" AND a.created_at >= :from");
            params.put("from", from);
        }
        if (to != null) {
            where.append(" AND a.created_at <= :to");
            params.put("to", to);
        }
        if (keyword != null && !keyword.isBlank()) {
            where.append(" AND (a.details::text ILIKE :kw OR a.action ILIKE :kw)");
            params.put("kw", "%" + keyword.trim() + "%");
        }

        Query countQuery = entityManager.createNativeQuery("SELECT count(*) FROM platform_audit_logs a" + where);
        params.forEach(countQuery::setParameter);
        long total = ((Number) countQuery.getSingleResult()).longValue();

        Query query = entityManager.createNativeQuery("""
                SELECT a.id, a.event_id, a.scope, a.tenant_id, a.actor_user_id, a.actor_type,
                       a.actor_email_snapshot, a.action, a.resource_type, a.resource_id,
                       a.target_tenant_id, a.target_user_id, a.result, a.correlation_id, a.details,
                       a.ip_address, a.user_agent, a.prev_hash, a.entry_hash, a.created_at,
                       t.name AS target_tenant_name
                FROM platform_audit_logs a
                LEFT JOIN tenants t ON t.id = a.target_tenant_id
                """ + where + " ORDER BY a.created_at DESC, a.id DESC LIMIT :size OFFSET :offset");
        params.forEach(query::setParameter);
        query.setParameter("size", size);
        query.setParameter("offset", page * size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<com.vn9melody.openerp.modules.platform.dto.PlatformResponses.AuditLogItem> items =
            new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            items.add(toAuditItem(row, false));
        }
        return new com.vn9melody.openerp.modules.platform.dto.PlatformPage<>(items, total);
    }

    public com.vn9melody.openerp.modules.platform.dto.PlatformResponses.AuditLogDetail findAuditLogDetail(
            UUID idOrEventId) {
        PlatformAuditLog log = entityManager.createQuery(
                "select a from PlatformAuditLog a where a.id = :id or a.eventId = :id", PlatformAuditLog.class)
            .setParameter("id", idOrEventId)
            .getResultStream()
            .findFirst()
            .orElse(null);
        if (log == null) {
            return null;
        }
        String tenantName = null;
        if (log.targetTenantId != null) {
            List<?> rows = entityManager.createNativeQuery("SELECT name FROM tenants WHERE id = :id")
                .setParameter("id", log.targetTenantId).getResultList();
            tenantName = rows.isEmpty() || rows.get(0) == null ? null : rows.get(0).toString();
        }
        com.vn9melody.openerp.modules.platform.dto.PlatformResponses.AuditLogDetail detail =
            new com.vn9melody.openerp.modules.platform.dto.PlatformResponses.AuditLogDetail();
        detail.logId = log.id.toString();
        detail.eventId = log.eventId != null ? log.eventId.toString() : null;
        detail.scope = log.scope != null ? log.scope.name() : null;
        detail.tenantId = log.tenantId != null ? log.tenantId.toString() : null;
        detail.actorUserId = log.actorUserId != null ? log.actorUserId.toString() : null;
        detail.actorType = log.actorType != null ? log.actorType.name() : null;
        detail.actorEmail = log.actorEmailSnapshot;
        detail.action = log.action;
        detail.resourceType = log.resourceType;
        detail.resourceId = log.resourceId != null ? log.resourceId.toString() : null;
        detail.targetTenantId = log.targetTenantId != null ? log.targetTenantId.toString() : null;
        detail.targetTenantName = tenantName;
        detail.targetUserId = log.targetUserId != null ? log.targetUserId.toString() : null;
        detail.result = log.result != null ? log.result.name() : null;
        detail.correlationId = log.correlationId != null ? log.correlationId.toString() : null;
        detail.details = log.details;
        detail.ipAddress = log.ipAddress;
        detail.userAgent = log.userAgent;
        detail.prevHash = log.prevHash;
        detail.entryHash = log.entryHash;
        detail.createdAt = log.createdAt;
        return detail;
    }

    private com.vn9melody.openerp.modules.platform.dto.PlatformResponses.AuditLogItem toAuditItem(
            Object[] row, boolean detail) {
        com.vn9melody.openerp.modules.platform.dto.PlatformResponses.AuditLogItem item =
            new com.vn9melody.openerp.modules.platform.dto.PlatformResponses.AuditLogItem();
        item.logId = row[0] != null ? row[0].toString() : null;
        item.eventId = row[1] != null ? row[1].toString() : null;
        item.scope = row[2] != null ? row[2].toString() : null;
        item.tenantId = row[3] != null ? row[3].toString() : null;
        item.actorUserId = row[4] != null ? row[4].toString() : null;
        item.actorType = row[5] != null ? row[5].toString() : null;
        item.actorEmail = row[6] != null ? row[6].toString() : null;
        item.action = row[7] != null ? row[7].toString() : null;
        item.resourceType = row[8] != null ? row[8].toString() : null;
        item.resourceId = row[9] != null ? row[9].toString() : null;
        item.targetTenantId = row[10] != null ? row[10].toString() : null;
        item.targetUserId = row[11] != null ? row[11].toString() : null;
        item.result = row[12] != null ? row[12].toString() : null;
        item.correlationId = row[13] != null ? row[13].toString() : null;
        item.details = parseDetails(row[14]);
        item.ipAddress = row[15] != null ? row[15].toString() : null;
        item.entryHash = row[18] != null ? row[18].toString() : null;
        item.createdAt = row[19] instanceof Instant instant ? instant : null;
        item.targetTenantName = row[20] != null ? row[20].toString() : null;
        return item;
    }

    private JsonNode parseDetails(Object value) {
        if (value == null) {
            return objectMapper.createObjectNode();
        }
        try {
            if (value instanceof String text) {
                return objectMapper.readTree(text);
            }
            return objectMapper.readTree(value.toString());
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }
}
