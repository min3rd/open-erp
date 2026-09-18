package com.vn9melody.openerp.modules.iam.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_credentials")
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
