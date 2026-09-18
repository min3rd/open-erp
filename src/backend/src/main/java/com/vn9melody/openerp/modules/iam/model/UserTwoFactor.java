package com.vn9melody.openerp.modules.iam.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_two_factor")
public class UserTwoFactor extends PanacheEntityBase {
    @Id
    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    public User user;

    @Column(name = "secret_key_enc")
    public String secretKeyEnc;

    @Column(name = "temp_secret_key")
    public String tempSecretKey;

    @Column(name = "is_enabled")
    public Boolean isEnabled = false;

    @Column(name = "backup_codes_hash", columnDefinition = "TEXT")
    public String backupCodesHash = "[]";

    @Column(name = "enabled_at")
    public Instant enabledAt;

    public static UserTwoFactor findByUserId(UUID userId) {
        return findById(userId);
    }
}
