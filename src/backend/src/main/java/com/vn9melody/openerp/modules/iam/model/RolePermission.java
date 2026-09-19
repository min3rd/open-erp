package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "role_permissions")
@IdClass(RolePermissionId.class)
@RegisterEntity(
    entityName = "RolePermission",
    table = "role_permissions",
    publicFields = {"role_id", "permission_id", "granted_at"},
    relations = {"roles", "permissions"}
)
public class RolePermission extends PanacheEntityBase {
    @Id
    @Column(name = "role_id", nullable = false)
    public UUID roleId;

    @Id
    @Column(name = "permission_id", nullable = false)
    public UUID permissionId;

    @Column(name = "granted_at")
    public Instant grantedAt = Instant.now();
}
