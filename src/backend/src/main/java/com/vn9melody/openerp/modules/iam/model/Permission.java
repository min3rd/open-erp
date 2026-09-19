package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "permissions")
@RegisterEntity(
    entityName = "Permission",
    table = "permissions",
    publicFields = {"id", "code", "domain", "resource", "action", "description_key", "is_system"}
)
public class Permission extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 64)
    public String code;

    @Column(name = "domain", nullable = false, length = 32)
    public String domain;

    @Column(name = "resource", nullable = false, length = 32)
    public String resource;

    @Column(name = "action", nullable = false, length = 32)
    public String action;

    @Column(name = "description_key", nullable = false, length = 128)
    public String descriptionKey;

    @Column(name = "is_system", nullable = false)
    public Boolean isSystem = true;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();
}
