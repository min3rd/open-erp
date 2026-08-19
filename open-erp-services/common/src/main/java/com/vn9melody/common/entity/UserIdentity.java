package com.vn9melody.common.entity;

import java.time.Instant;

import com.vn9melody.common.enums.AuthProvider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "user_identities", uniqueConstraints = {
                @UniqueConstraint(name = "uk_tenant_provider_user", columnNames = { "tenant_id", "provider",
                                "provider_user_id" })
}, indexes = {
                @Index(name = "idx_provider_user_id", columnList = "provider, provider_user_id"),
                @Index(name = "idx_identity_email", columnList = "email")
})
public class UserIdentity extends BaseTenantEntity {

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        public User user;

        @Enumerated(EnumType.STRING)
        @Column(name = "provider", nullable = false, length = 50)
        public AuthProvider provider;

        /**
         * Định danh duy nhất từ Identity Provider:
         * - OAuth2 / OIDC: claim 'sub' (hoặc 'oid' trong Azure AD)
         * - LDAP / Active Directory: Distinguished Name (DN) hoặc
         * objectGUID/sAMAccountName
         * - SAML 2.0: NameID
         * - Local: username
         */
        @Column(name = "provider_user_id", nullable = false, length = 255)
        public String providerUserId;

        @Column(name = "email", length = 255)
        public String email;

        @Column(name = "display_name", length = 255)
        public String displayName;

        @Column(name = "avatar_url", length = 500)
        public String avatarUrl;

        /**
         * Dữ liệu JSON thô trả về từ IdP (chứa roles bên ngoài, LDAP groups, token
         * attributes...)
         */
        @Column(name = "raw_attributes", columnDefinition = "TEXT")
        public String rawAttributes;

        @Column(name = "last_synced_at")
        public Instant lastSyncedAt;

        @Column(name = "is_linked", nullable = false)
        public boolean isLinked = true;
}
