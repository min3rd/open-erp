package com.vn9melody.services;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.vn9melody.dto.LoginResponse;
import com.vn9melody.dto.UserProfileDto;
import com.vn9melody.entities.RolePermission;
import com.vn9melody.entities.User;
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

    @Transactional
    public LoginResponse authenticate(String username, String password) {
        User user = User.<User>find("username = ?1 and isDeleted = false", username)
                .firstResultOptional()
                .orElseThrow(() -> new AuthenticationFailedException("Tên đăng nhập hoặc mật khẩu không chính xác"));

        if (!user.isActive) {
            throw new UnauthorizedException("Tài khoản người dùng đã bị khóa");
        }

        if (user.password == null || !BcryptUtil.matches(password, user.password)) {
            throw new AuthenticationFailedException("Tên đăng nhập hoặc mật khẩu không chính xác");
        }

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

        if (!user.isActive) {
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
