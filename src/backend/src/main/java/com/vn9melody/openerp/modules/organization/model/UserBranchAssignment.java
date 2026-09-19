package com.vn9melody.openerp.modules.organization.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_branch_assignments")
@RegisterEntity(
    entityName = "UserBranchAssignment",
    pluginId = "core-organization",
    table = "user_branch_assignments",
    publicFields = {"id", "user_id", "tenant_id", "branch_id", "is_primary", "can_manage", "assigned_at"},
    relations = {"users", "tenants", "branches"}
)
public class UserBranchAssignment extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "branch_id", nullable = false)
    public UUID branchId;

    @Column(name = "is_primary", nullable = false)
    public Boolean isPrimary = false;

    @Column(name = "can_manage", nullable = false)
    public Boolean canManage = true;

    @Column(name = "assigned_at")
    public Instant assignedAt = Instant.now();
}
