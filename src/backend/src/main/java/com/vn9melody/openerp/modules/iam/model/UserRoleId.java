package com.vn9melody.openerp.modules.iam.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class UserRoleId implements Serializable {

    private UUID userId;
    private UUID tenantId;
    private UUID roleId;

    public UserRoleId() {
    }

    public UserRoleId(UUID userId, UUID tenantId, UUID roleId) {
        this.userId = userId;
        this.tenantId = tenantId;
        this.roleId = roleId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getRoleId() {
        return roleId;
    }

    public void setRoleId(UUID roleId) {
        this.roleId = roleId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof UserRoleId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId)
            && Objects.equals(tenantId, that.tenantId)
            && Objects.equals(roleId, that.roleId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, tenantId, roleId);
    }
}
