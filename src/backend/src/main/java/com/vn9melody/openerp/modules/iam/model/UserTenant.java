package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.enums.UserRole;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_tenants")
public class UserTenant extends PanacheEntityBase {
    @EmbeddedId
    public UserTenantId id = new UserTenantId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    public User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("tenantId")
    @JoinColumn(name = "tenant_id")
    public Tenant tenant;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 32)
    public UserRole role = UserRole.MEMBER;

    @Column(name = "is_default")
    public Boolean isDefault = false;

    @Column(name = "joined_at")
    public Instant joinedAt = Instant.now();

    public static List<UserTenant> listByUserId(UUID userId) {
        return list("id.userId", userId);
    }

    public static UserTenant findByUserAndTenant(UUID userId, UUID tenantId) {
        return find("id.userId = ?1 and id.tenantId = ?2", userId, tenantId).firstResult();
    }
}
