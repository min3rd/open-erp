package com.vn9melody.openerp.modules.platform.service;

import java.time.Instant;
import java.util.UUID;

public class AuditChainVerification {

    public enum Status { VERIFIED, TAMPERED }

    public Status status = Status.VERIFIED;
    public long checkedCount;
    public UUID brokenAtLogId;
    public UUID brokenAtEventId;
    public Instant brokenAtCreatedAt;
    public String reason;

    public static AuditChainVerification verified(long checked) {
        AuditChainVerification result = new AuditChainVerification();
        result.status = Status.VERIFIED;
        result.checkedCount = checked;
        return result;
    }

    public static AuditChainVerification tampered(long checked, UUID logId, UUID eventId,
                                                  Instant createdAt, String reason) {
        AuditChainVerification result = new AuditChainVerification();
        result.status = Status.TAMPERED;
        result.checkedCount = checked;
        result.brokenAtLogId = logId;
        result.brokenAtEventId = eventId;
        result.brokenAtCreatedAt = createdAt;
        result.reason = reason;
        return result;
    }
}
