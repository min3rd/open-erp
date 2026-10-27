package com.vn9melody.openerp.plugin.sdk.runtime;

import jakarta.enterprise.context.RequestScoped;
import java.util.Set;
import java.util.UUID;

/** Request-scoped caller context populated by {@link TenantContextFilter}. */
@RequestScoped
public class TenantContext {

    private UUID tenantId;
    private UUID userId;
    private Set<String> roleCodes = Set.of();
    private Set<String> permissions = Set.of();
    private boolean platform;

    public UUID tenantId() {
        return tenantId;
    }

    public UUID userId() {
        return userId;
    }

    public Set<String> roleCodes() {
        return roleCodes;
    }

    public Set<String> permissions() {
        return permissions;
    }

    public boolean platform() {
        return platform;
    }

    public UserContext user() {
        return new UserContext(tenantId, userId, roleCodes, permissions, platform);
    }

    void set(UUID tenantId, UUID userId, Set<String> roleCodes, Set<String> permissions, boolean platform) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.roleCodes = roleCodes;
        this.permissions = permissions;
        this.platform = platform;
    }
}
