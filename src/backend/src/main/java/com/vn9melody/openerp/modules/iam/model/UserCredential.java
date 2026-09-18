package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_credentials")
@RegisterEntity(
    entityName = "UserCredential",
    table = "user_credentials",
    publicFields = {"user_id", "failed_login_count", "locked_until", "password_updated_at"},
    relations = {"users"}
)
public class UserCredential extends PanacheEntityBase {
    @Id
    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    public User user;

    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    @Column(name = "failed_login_count")
    public Integer failedLoginCount = 0;

    @Column(name = "locked_until")
    public Instant lockedUntil;

    @Column(name = "password_updated_at")
    public Instant passwordUpdatedAt = Instant.now();

    public static UserCredential findByUserId(UUID userId) {
        return findById(userId);
    }
}
