package com.vn9melody.openerp.modules.iam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class UserTenantId implements Serializable {
    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    public UserTenantId() {}

    public UserTenantId(UUID userId, UUID tenantId) {
        this.userId = userId;
        this.tenantId = tenantId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserTenantId that = (UserTenantId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(tenantId, that.tenantId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, tenantId);
    }
}
