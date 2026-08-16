package com.vn9melody.services;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.vn9melody.dto.LoginResponse;
import com.vn9melody.dto.UserProfileDto;
import com.vn9melody.entities.RolePermission;
import com.vn9melody.entities.User;
import com.vn9melody.entities.UserIdentity;
import com.vn9melody.enums.AuthProvider;
import com.vn9melody.enums.UserStatus;
import com.vn9melody.security.jwt.JwtClaimsConstant;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.value.SetArgs;
import io.quarkus.redis.datasource.value.ValueCommands;
import io.quarkus.security.AuthenticationFailedException;
import io.quarkus.security.UnauthorizedException;
import io.smallrye.jwt.build.Jwt;
import io.smallrye.jwt.build.JwtClaimsBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class JwtTokenService {

    private static final Logger LOG = Logger.getLogger(JwtTokenService.class);

    @Inject
    RedisDataSource redisDataSource;

    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "open-erp-auth")
    String jwtIssuer;

    @ConfigProperty(name = "app.jwt.access-token-ttl-minutes", defaultValue = "60")
    long accessTokenTtlMinutes;

    @ConfigProperty(name = "app.jwt.refresh-token-ttl-days", defaultValue = "14")
    long refreshTokenTtlDays;

    @ConfigProperty(name = "app.cache.redis.refresh-token-prefix", defaultValue = "saas:security:refresh:")
    String refreshTokenPrefix;

    private ValueCommands<String, String> redisValueCommands;

    @PostConstruct
    void init() {
        this.redisValueCommands = redisDataSource.value(String.class);
    }

    /**
     * Xác thực người dùng qua Mật khẩu cục bộ (Local Credentials)
     */
    @Transactional
    public LoginResponse authenticate(String username, String password) {
        User user = User.<User>find("username = ?1 and isDeleted = false", username)
                .firstResultOptional()
                .orElseThrow(() -> new AuthenticationFailedException("Tên đăng nhập hoặc mật khẩu không chính xác"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Tài khoản người dùng đã bị khóa hoặc vô hiệu hóa");
        }

        if (user.password == null || !BcryptUtil.matches(password, user.password)) {
            user.failedLoginAttempts++;
            if (user.failedLoginAttempts >= 5) {
                user.lockoutUntil = Instant.now().plus(Duration.ofMinutes(15));
                LOG.warnf("Tài khoản %s bị tạm khóa 15 phút do nhập sai 5 lần", username);
            }
            throw new AuthenticationFailedException("Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        // Đăng nhập thành công -> Reset failed attempts & cập nhật login timestamp
        user.failedLoginAttempts = 0;
        user.lockoutUntil = null;
        user.lastLoginAt = Instant.now();

        return generateTokensForUser(user);
    }

    /**
     * Xác thực / Đăng ký tự động qua Giao thức liên kết (OAuth2, OpenID, LDAP, SAML...)
     */
    @Transactional
    public LoginResponse authenticateFederated(String tenantId, AuthProvider provider, String providerUserId,
            String email, String displayName, String rawAttributes) {

        // 1. Tìm kiếm UserIdentity đã liên kết
        UserIdentity identity = UserIdentity.<UserIdentity>find(
                "tenantId = ?1 and provider = ?2 and providerUserId = ?3 and isDeleted = false",
                tenantId, provider, providerUserId)
                .firstResultOptional()
                .orElse(null);

        User user;
        if (identity != null) {
            user = identity.user;
            identity.displayName = displayName;
            identity.rawAttributes = rawAttributes;
            identity.lastSyncedAt = Instant.now();
        } else {
            // Tìm User theo email trong cùng tenant
            user = User.<User>find("tenantId = ?1 and email = ?2 and isDeleted = false", tenantId, email)
                    .firstResultOptional()
                    .orElse(null);

            if (user == null) {
                // Tạo mới User qua Federation (Just-In-Time Provisioning)
                user = new User();
                user.tenantId = tenantId;
                user.username = email;
                user.email = email;
                user.fullName = displayName;
                user.primaryAuthProvider = provider;
                user.status = UserStatus.ACTIVE;
                user.persist();
            }

            // Tạo bản ghi UserIdentity liên kết
            UserIdentity newIdentity = new UserIdentity();
            newIdentity.tenantId = tenantId;
            newIdentity.user = user;
            newIdentity.provider = provider;
            newIdentity.providerUserId = providerUserId;
            newIdentity.email = email;
            newIdentity.displayName = displayName;
            newIdentity.rawAttributes = rawAttributes;
            newIdentity.lastSyncedAt = Instant.now();
            newIdentity.persist();
        }

        if (!user.isActive()) {
            throw new UnauthorizedException("Tài khoản người dùng đã bị khóa hoặc vô hiệu hóa");
        }

        user.lastLoginAt = Instant.now();
        return generateTokensForUser(user);
    }

    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token không hợp lệ");
        }

        String redisKey = refreshTokenPrefix + refreshToken;
        String username = null;
        try {
            username = redisValueCommands.get(redisKey);
        } catch (Exception e) {
            LOG.errorf("Lỗi khi đọc refresh token từ Redis: %s", e.getMessage());
        }

        if (username == null) {
            throw new UnauthorizedException("Refresh token đã hết hạn hoặc không hợp lệ");
        }

        User user = User.<User>find("username = ?1 and isDeleted = false", username)
                .firstResultOptional()
                .orElseThrow(() -> new UnauthorizedException("Không tìm thấy thông tin người dùng"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Tài khoản người dùng đã bị khóa");
        }

        // Xóa refresh token cũ (Token rotation)
        try {
            redisValueCommands.getdel(redisKey);
        } catch (Exception e) {
            LOG.warnf("Không thể xóa refresh token cũ: %s", e.getMessage());
        }

        return generateTokensForUser(user);
    }

    public void revokeRefreshToken(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                redisValueCommands.getdel(refreshTokenPrefix + refreshToken);
            } catch (Exception e) {
                LOG.errorf("Lỗi khi revoke refresh token: %s", e.getMessage());
            }
        }
    }

    private LoginResponse generateTokensForUser(User user) {
        // 1. Thu thập Roles & Permissions
        Set<String> roleNames = new HashSet<>();
        if (user.roles != null) {
            user.roles.forEach(r -> roleNames.add(r.code.name()));
        }

        List<RolePermission> rolePermissions = RolePermission.find(
                "role.id in (select r.id from User u join u.roles r where u.id = ?1) and isDeleted = false",
                user.id).list();

        Set<String> permissionNames = new HashSet<>();
        if (rolePermissions != null) {
            rolePermissions.forEach(rp -> {
                if (rp.permission != null && rp.permission.code != null) {
                    permissionNames.add(rp.permission.code.name());
                }
            });
        }

        Long departmentId = user.department != null ? user.department.id : null;

        // 2. Ký Access Token bằng RSA Private Key
        JwtClaimsBuilder claimsBuilder = Jwt.issuer(jwtIssuer)
                .upn(user.username)
                .subject(user.username)
                .groups(roleNames)
                .claim(JwtClaimsConstant.USER_ID, user.id)
                .claim(JwtClaimsConstant.TENANT_ID, user.tenantId)
                .claim(JwtClaimsConstant.PERMISSIONS, permissionNames)
                .expiresIn(Duration.ofMinutes(accessTokenTtlMinutes));

        if (departmentId != null) {
            claimsBuilder.claim(JwtClaimsConstant.DEPARTMENT_ID, departmentId);
        }

        String accessToken = claimsBuilder.sign();

        // 3. Ký Refresh Token
        String refreshToken = Jwt.issuer(jwtIssuer)
                .subject(user.username)
                .claim("type", "REFRESH")
                .claim(JwtClaimsConstant.TENANT_ID, user.tenantId)
                .expiresIn(Duration.ofDays(refreshTokenTtlDays))
                .sign();

        // 4. Lưu Refresh Token vào Redis
        try {
            long ttlSeconds = refreshTokenTtlDays * 24 * 3600;
            redisValueCommands.set(refreshTokenPrefix + refreshToken, user.username, new SetArgs().ex(ttlSeconds));
        } catch (Exception e) {
            LOG.warnf("Không thể lưu refresh token vào Redis: %s", e.getMessage());
        }

        UserProfileDto profile = new UserProfileDto(
                user.id,
                user.tenantId,
                user.username,
                user.email,
                departmentId,
                roleNames,
                permissionNames);

        return new LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                accessTokenTtlMinutes * 60,
                profile);
    }
}
