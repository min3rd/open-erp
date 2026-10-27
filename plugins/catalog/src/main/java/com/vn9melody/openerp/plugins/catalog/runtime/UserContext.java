package com.vn9melody.openerp.plugins.catalog.runtime;

import java.util.Set;
import java.util.UUID;

/** Minimal caller context forwarded by the core runtime gateway. */
public record UserContext(
    UUID tenantId,
    UUID userId,
    Set<String> roleCodes,
    Set<String> permissions,
    boolean platform
) {

    public UserContext {
        roleCodes = roleCodes == null ? Set.of() : Set.copyOf(roleCodes);
        permissions = permissions == null ? Set.of() : Set.copyOf(permissions);
    }

    public boolean hasPermission(String code) {
        return code == null || code.isBlank() || permissions.contains(code);
    }
}
