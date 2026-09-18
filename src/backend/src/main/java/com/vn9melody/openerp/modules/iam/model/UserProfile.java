package com.vn9melody.openerp.modules.iam.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
public class UserProfile extends PanacheEntityBase {
    @Id
    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    public User user;

    @Column(name = "full_name", nullable = false, length = 128)
    public String fullName;

    @Column(name = "phone", length = 32)
    public String phone;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    public String avatarUrl;

    @Column(name = "language", length = 8)
    public String language = "vi";

    @Column(name = "timezone", length = 64)
    public String timezone = "Asia/Ho_Chi_Minh";

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    public static UserProfile findByUserId(UUID userId) {
        return findById(userId);
    }
}
