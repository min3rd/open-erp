package com.vn9melody.openerp.modules.organization.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "branches")
@RegisterEntity(
    entityName = "Branch",
    pluginId = "core-organization",
    table = "branches",
    publicFields = {"id", "tenant_id", "code", "name", "is_default", "status", "created_at"},
    relations = {"tenants"}
)
public class Branch extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "code", nullable = false, length = 32)
    public String code;

    @Column(name = "name", nullable = false)
    public String name;

    @Column(name = "phone", length = 32)
    public String phone;

    @Column(name = "address", columnDefinition = "text")
    public String address;

    @Column(name = "is_default", nullable = false)
    public Boolean isDefault = false;

    @Column(name = "status", nullable = false, length = 32)
    public String status = "ACTIVE";

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();
}
