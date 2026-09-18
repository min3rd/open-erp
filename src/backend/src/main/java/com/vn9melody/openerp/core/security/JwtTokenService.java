package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.enums.UserRole;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class JwtTokenService {
    private static final String ISSUER = "https://openerp.9ms.io.vn/auth";

    public String generateAccessToken(UUID userId, String email, UUID tenantId, String role) {
        return Jwt.issuer(ISSUER)
                .upn(email)
                .subject(userId.toString())
                .claim("email", email)
                .claim("tenant_id", tenantId != null ? tenantId.toString() : null)
                .claim("role", role != null ? role : "MEMBER")
                .groups(role != null ? Set.of(role) : Set.of("MEMBER"))
                .expiresIn(Duration.ofMinutes(15))
                .sign();
    }

    public String generateAccessToken(UUID userId, String email, UUID tenantId, UserRole role) {
        return generateAccessToken(userId, email, tenantId, role != null ? role.name() : "MEMBER");
    }

    public String generatePreAuthToken(UUID userId, String purpose) {
        return Jwt.issuer(ISSUER)
                .subject(userId.toString())
                .claim("type", "PRE_AUTH")
                .claim("purpose", purpose)
                .expiresIn(Duration.ofMinutes(5))
                .sign();
    }

    public String generateRefreshToken(UUID userId) {
        return Jwt.issuer(ISSUER)
                .subject(userId.toString())
                .claim("type", "REFRESH")
                .expiresIn(Duration.ofDays(7))
                .sign();
    }
}
