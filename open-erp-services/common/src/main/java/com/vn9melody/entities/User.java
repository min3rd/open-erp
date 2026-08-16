package com.vn9melody.entities;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.vn9melody.enums.AuthProvider;
import com.vn9melody.enums.MfaType;
import com.vn9melody.enums.UserStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_username", columnNames = {"tenant_id", "username"}),
        @UniqueConstraint(name = "uk_tenant_email", columnNames = {"tenant_id", "email"})
    },
    indexes = {
        @Index(name = "idx_user_tenant_status", columnList = "tenant_id, status"),
        @Index(name = "idx_user_external_id", columnList = "tenant_id, external_id")
    }
)
public class User extends BaseTenantEntity {

    // --- Thông tin định danh cơ bản ---
    @Column(nullable = false, length = 100)
    public String username;

    @Column(nullable = false, length = 255)
    public String email;

    @Column(name = "full_name", length = 255)
    public String fullName;

    @Column(name = "phone_number", length = 30)
    public String phoneNumber;

    @Column(name = "avatar_url", length = 500)
    public String avatarUrl;

    // --- Mật khẩu cục bộ (Nullable nếu chỉ đăng nhập qua OIDC/OAuth/LDAP/SAML) ---
    @Column(name = "password_hash", length = 255)
    public String password;

    // --- Trạng thái tài khoản & Phương thức đăng nhập chính ---
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    public UserStatus status = UserStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_auth_provider", nullable = false, length = 50)
    public AuthProvider primaryAuthProvider = AuthProvider.LOCAL;

    // --- Xác thực 2 bước (MFA / 2FA) ---
    @Column(name = "is_mfa_enabled", nullable = false)
    public boolean isMfaEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "mfa_type", length = 20)
    public MfaType mfaType = MfaType.NONE;

    @Column(name = "mfa_secret", length = 255)
    public String mfaSecret; // Secret key TOTP (được mã hóa)

    // --- Bảo mật chống Brute Force & Audit đăng nhập ---
    @Column(name = "failed_login_attempts", nullable = false)
    public int failedLoginAttempts = 0;

    @Column(name = "lockout_until")
    public Instant lockoutUntil;

    @Column(name = "last_login_at")
    public Instant lastLoginAt;

    @Column(name = "last_login_ip", length = 50)
    public String lastLoginIp;

    @Column(name = "password_changed_at")
    public Instant passwordChangedAt;

    @Column(name = "must_change_password", nullable = false)
    public boolean mustChangePassword = false;

    // --- Tích hợp đồng bộ thư mục doanh nghiệp (LDAP / Active Directory / SCIM) ---
    @Column(name = "external_id", length = 255)
    public String externalId;

    // --- Quan hệ phòng ban & phân quyền ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", insertable = false, updatable = false)
    public Department department;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    public Set<Role> roles = new HashSet<>();

    // --- Danh sách các Identity Provider liên kết (OAuth2, OpenID, LDAP, SAML...) ---
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<UserIdentity> identities = new ArrayList<>();

    // --- Helper methods ---
    public boolean isActive() {
        return this.status == UserStatus.ACTIVE && (this.lockoutUntil == null || this.lockoutUntil.isBefore(Instant.now()));
    }

    public void addIdentity(UserIdentity identity) {
        if (identity != null) {
            identity.user = this;
            identity.tenantId = this.tenantId;
            this.identities.add(identity);
        }
    }
}