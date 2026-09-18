package com.vn9melody.openerp.modules.iam.model;

import com.vn9melody.openerp.core.enums.AccountStatus;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User extends PanacheEntityBase {
    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "email", nullable = false, unique = true)
    public String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    public AccountStatus status = AccountStatus.PENDING_VERIFICATION;

    @Column(name = "email_verified_at")
    public Instant emailVerifiedAt;

    @Column(name = "verification_otp", length = 16)
    public String verificationOtp;

    @Column(name = "verification_otp_expires_at")
    public Instant verificationOtpExpiresAt;

    @Column(name = "created_at")
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    public static User findByEmail(String email) {
        if (email == null) return null;
        return find("lower(email)", email.toLowerCase().trim()).firstResult();
    }
}
