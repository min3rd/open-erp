package com.vn9melody.openerp.core.security.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PermissionInvalidationPayload(
    @JsonProperty("tenant_id") String tenantId,
    @JsonProperty("affected_user_ids") List<String> affectedUserIds,
    @JsonProperty("reason") String reason
) {

    public static PermissionInvalidationPayload from(PermissionInvalidationEvent event) {
        return new PermissionInvalidationPayload(
            event.tenantId() != null ? event.tenantId().toString() : null,
            event.affectedUserIds() == null
                ? List.of()
                : event.affectedUserIds().stream().map(UUID::toString).toList(),
            event.reason()
        );
    }
}
