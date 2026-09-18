package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.enums.UserRole;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class JwtTokenService {

    public static final String TYPE_PRE_AUTH = "PRE_AUTH";
    public static final String TYPE_REFRESH = "REFRESH";

    @Inject
    JWTParser jwtParser;

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    public String generateAccessToken(UUID userId, String email, UUID tenantId, String role, String sessionId) {
        return Jwt.issuer(issuer)
                .upn(email)
                .subject(userId.toString())
                .claim("jti", UUID.randomUUID().toString())
                .claim("email", email)
                .claim("tenant_id", tenantId != null ? tenantId.toString() : null)
                .claim("role", role != null ? role : "MEMBER")
                .claim("session_id", sessionId)
                .groups(role != null ? Set.of(role) : Set.of("MEMBER"))
                .expiresIn(Duration.ofMinutes(15))
                .sign();
    }

    public String generateAccessToken(UUID userId, String email, UUID tenantId, UserRole role, String sessionId) {
        return generateAccessToken(userId, email, tenantId, role != null ? role.name() : "MEMBER", sessionId);
    }

    public String generateRefreshToken(UUID userId, UUID tenantId, String role, String sessionId) {
        return Jwt.issuer(issuer)
                .subject(userId.toString())
                .claim("jti", UUID.randomUUID().toString())
                .claim("type", TYPE_REFRESH)
                .claim("tenant_id", tenantId != null ? tenantId.toString() : null)
                .claim("role", role != null ? role : "MEMBER")
                .claim("session_id", sessionId)
                .expiresIn(Duration.ofDays(7))
                .sign();
    }

    public String generatePreAuthToken(UUID userId, String purpose, String jti) {
        return Jwt.issuer(issuer)
                .subject(userId.toString())
                .claim("jti", jti)
                .claim("type", TYPE_PRE_AUTH)
                .claim("purpose", purpose)
                .expiresIn(Duration.ofMinutes(5))
                .sign();
    }

    public JsonWebToken parseToken(String token) throws ParseException {
        return jwtParser.parse(token);
    }
}
