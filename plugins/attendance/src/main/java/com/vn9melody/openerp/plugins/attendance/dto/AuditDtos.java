package com.vn9melody.openerp.plugins.attendance.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public final class AuditDtos {

    private AuditDtos() {}

    public record AuditLogDto(
            @JsonProperty("id") UUID id,
            @JsonProperty("actor_user_id") UUID actorUserId,
            @JsonProperty("action") String action,
            @JsonProperty("entity_type") String entityType,
            @JsonProperty("entity_id") UUID entityId,
            @JsonProperty("detail") Map<String, Object> detail,
            @JsonProperty("created_at") Instant createdAt
    ) {}
}
