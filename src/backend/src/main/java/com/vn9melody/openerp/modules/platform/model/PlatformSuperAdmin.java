package com.vn9melody.openerp.modules.platform.model;

import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_super_admins")
@RegisterEntity(
    entityName = "PlatformSuperAdmin",
    pluginId = "core-platform",
    table = "platform_super_admins",
    publicFields = {"id", "user_id", "role", "is_active", "status", "must_change_password", "two_factor_required", "last_login_at"},
    relations = {"users"}
)
public class PlatformSuperAdmin extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    public UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 32)
    public PlatformAdminRole role = PlatformAdminRole.SUPER_ADMIN;

    @Column(name = "is_active", nullable = false)
    public Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    public PlatformAdminStatus status = PlatformAdminStatus.ACTIVE;

    @Column(name = "must_change_password", nullable = false)
    public Boolean mustChangePassword = true;

    @Column(name = "two_factor_required", nullable = false)
    public Boolean twoFactorRequired = true;

    @Column(name = "last_login_at")
    public Instant lastLoginAt;

    @Column(name = "disabled_at")
    public Instant disabledAt;

    @Column(name = "disabled_by")
    public UUID disabledBy;

    @Column(name = "granted_by")
    public UUID grantedBy;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    @PrePersist
    @PreUpdate
    public void syncActiveFlag() {
        this.isActive = status == PlatformAdminStatus.ACTIVE;
    }
}
