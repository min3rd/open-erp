package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_roles")
@IdClass(UserRoleId.class)
@RegisterEntity(
    entityName = "UserRole",
    table = "user_roles",
    publicFields = {"user_id", "tenant_id", "role_id", "assigned_at", "assigned_by"},
    relations = {"users", "tenants", "roles"}
)
public class UserRole extends PanacheEntityBase {
    @Id
    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @Id
    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Id
    @Column(name = "role_id", nullable = false)
    public UUID roleId;

    @Column(name = "assigned_at")
    public Instant assignedAt = Instant.now();

    @Column(name = "assigned_by")
    public UUID assignedBy;
}
