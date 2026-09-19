package com.vn9melody.openerp.modules.organization.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "departments")
@RegisterEntity(
    entityName = "Department",
    pluginId = "core-organization",
    table = "departments",
    publicFields = {"id", "tenant_id", "branch_id", "parent_id", "code", "name", "manager_user_id", "status", "created_at"},
    relations = {"tenants", "branches", "users", "departments"}
)
public class Department extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "branch_id")
    public UUID branchId;

    @Column(name = "parent_id")
    public UUID parentId;

    @Column(name = "code", nullable = false, length = 32)
    public String code;

    @Column(name = "name", nullable = false)
    public String name;

    @Column(name = "manager_user_id")
    public UUID managerUserId;

    @Column(name = "status", nullable = false, length = 32)
    public String status = "ACTIVE";

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();
}
