package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "role_data_policies")
@RegisterEntity(
    entityName = "RoleDataPolicy",
    table = "role_data_policies",
    publicFields = {
        "id", "tenant_id", "role_id", "resource",
        "create_scope", "read_scope", "update_scope",
        "delete_scope", "export_scope", "share_scope"
    },
    relations = {"tenants", "roles"}
)
public class RoleDataPolicy extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "role_id", nullable = false)
    public UUID roleId;

    @Column(name = "resource", nullable = false, length = 64)
    public String resource;

    @Enumerated(EnumType.STRING)
    @Column(name = "create_scope", nullable = false, length = 32)
    public DataScope createScope = DataScope.OWN_ONLY;

    @Enumerated(EnumType.STRING)
    @Column(name = "read_scope", nullable = false, length = 32)
    public DataScope readScope = DataScope.OWN_ONLY;

    @Enumerated(EnumType.STRING)
    @Column(name = "update_scope", nullable = false, length = 32)
    public DataScope updateScope = DataScope.OWN_ONLY;

    @Enumerated(EnumType.STRING)
    @Column(name = "delete_scope", nullable = false, length = 32)
    public DataScope deleteScope = DataScope.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "export_scope", nullable = false, length = 32)
    public DataScope exportScope = DataScope.NONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "share_scope", nullable = false, length = 32)
    public DataScope shareScope = DataScope.NONE;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();
}
