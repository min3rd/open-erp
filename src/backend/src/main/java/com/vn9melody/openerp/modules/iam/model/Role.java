package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "roles")
@RegisterEntity(
    entityName = "Role",
    table = "roles",
    publicFields = {"id", "tenant_id", "code", "name", "is_system", "created_at"},
    relations = {"tenants"}
)
public class Role extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id")
    public UUID tenantId;

    @Column(name = "code", nullable = false, length = 64)
    public String code;

    @Column(name = "name", nullable = false, length = 128)
    public String name;

    @Column(name = "description", columnDefinition = "text")
    public String description;

    @Column(name = "is_system", nullable = false)
    public Boolean isSystem = false;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();
}
