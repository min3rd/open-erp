package com.vn9melody.openerp.modules.organization.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_department_memberships")
@RegisterEntity(
    entityName = "UserDepartmentMembership",
    pluginId = "core-organization",
    table = "user_department_memberships",
    publicFields = {"id", "user_id", "tenant_id", "branch_id", "department_id", "direct_manager_user_id", "is_primary", "joined_at"},
    relations = {"users", "tenants", "branches", "departments"}
)
public class UserDepartmentMembership extends PanacheEntityBase {
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

    @Column(name = "department_id", nullable = false)
    public UUID departmentId;

    @Column(name = "direct_manager_user_id")
    public UUID directManagerUserId;

    @Column(name = "title", length = 128)
    public String title;

    @Column(name = "is_primary", nullable = false)
    public Boolean isPrimary = true;

    @Column(name = "joined_at")
    public Instant joinedAt = Instant.now();
}
