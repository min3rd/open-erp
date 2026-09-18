package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.registry.RegisterEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens")
@RegisterEntity(
    entityName = "PasswordResetToken",
    table = "password_reset_tokens",
    publicFields = {"id", "user_id", "expires_at", "used_at", "created_at"},
    relations = {"users"}
)
public class PasswordResetToken extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @Column(name = "token_hash", nullable = false, length = 64)
    public String tokenHash;

    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;

    @Column(name = "used_at")
    public Instant usedAt;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    public static PasswordResetToken findValidToken(String tokenHash) {
        return find("tokenHash = ?1 and usedAt is null and expiresAt > ?2", tokenHash, Instant.now()).firstResult();
    }
}
