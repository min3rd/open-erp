package com.vn9melody.security;

import com.vn9melody.common.entity.RolePermission;
import com.vn9melody.common.entity.User;
import com.vn9melody.common.enums.DataScope;
import com.vn9melody.common.enums.PermissionCode;
import com.vn9melody.security.dto.CacheInvalidationEvent;
import com.vn9melody.security.dto.PermissionScopeDto;
import com.vn9melody.security.dto.UserSecurityProfile;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.pubsub.PubSubCommands;
import io.quarkus.redis.datasource.pubsub.PubSubCommands.RedisSubscriber;
import io.quarkus.redis.datasource.value.SetArgs;
import io.quarkus.redis.datasource.value.ValueCommands;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PermissionService {

    private static final Logger LOG = Logger.getLogger(PermissionService.class);

    @Inject
    RedisDataSource redisDataSource;

    @ConfigProperty(name = "app.cache.redis.prefix", defaultValue = "saas:security:user:")
    String redisKeyPrefix;

    @ConfigProperty(name = "app.cache.redis.ttl-seconds", defaultValue = "1800")
    long redisTtlSeconds;

    @ConfigProperty(name = "app.cache.local.ttl-seconds", defaultValue = "300")
    long localTtlSeconds;

    @ConfigProperty(name = "app.cache.redis.pubsub-channel", defaultValue = "saas:cache:invalidation")
    String invalidationChannel;

    private ValueCommands<String, UserSecurityProfile> redisCommands;
    private PubSubCommands<CacheInvalidationEvent> pubsubCommands;
    private Cache<String, UserSecurityProfile> localCache;
    private RedisSubscriber subscriber;

    @PostConstruct
    void init() {
        this.redisCommands = redisDataSource.value(UserSecurityProfile.class);
        this.pubsubCommands = redisDataSource.pubsub(CacheInvalidationEvent.class);

        this.localCache = Caffeine.newBuilder()
                .maximumSize(5_000)
                .expireAfterWrite(Duration.ofSeconds(localTtlSeconds))
                .build();
    }

    /**
     * Khởi động Subscriber khi Pod bật lên để lắng nghe lệnh xóa L1 Cache
     */
    void onStart(@Observes StartupEvent ev) {
        this.subscriber = pubsubCommands.subscribe(invalidationChannel, event -> {
            LOG.debugf("[PUBSUB-RECEIVED] Nhận tín hiệu xóa L1 Cache cho user: %s (Lý do: %s)",
                    event.username(), event.reason());

            // Xóa cục bộ trên RAM của Pod này
            localCache.invalidate(event.username());
        });
        LOG.infof("Đã đăng ký Redis Pub/Sub channel: %s", invalidationChannel);
    }

    /**
     * Hủy đăng ký khi Pod tắt để tránh leak connection
     */
    void onStop(@Observes ShutdownEvent ev) {
        if (subscriber != null) {
            subscriber.unsubscribe();
        }
    }

    /**
     * Truy vấn thông tin: L1 (Local) -> L2 (Redis) -> DB
     */
    public UserSecurityProfile getUserSecurityProfile(String username) {
        UserSecurityProfile profile = localCache.getIfPresent(username);
        if (profile != null) {
            return profile;
        }

        String redisKey = redisKeyPrefix + username;
        try {
            profile = redisCommands.get(redisKey);
            if (profile != null) {
                localCache.put(username, profile);
                return profile;
            }
        } catch (Exception e) {
            LOG.warnf("Lỗi đọc Redis, chuyển sang DB: %s", e.getMessage());
        }

        profile = loadFromDatabase(username);
        if (profile != null) {
            try {
                redisCommands.set(redisKey, profile, new SetArgs().ex(redisTtlSeconds));
            } catch (Exception e) {
                LOG.warnf("Ghi Redis thất bại: %s", e.getMessage());
            }
            localCache.put(username, profile);
        }
        return profile;
    }

    /**
     * Xóa cache toàn hệ thống:
     * 1. Xóa L2 trong Redis.
     * 2. Bắn Pub/Sub để toàn bộ các Pod xóa L1 local memory.
     */
    public void invalidateUserCacheGlobally(String username, String reason) {
        // 1. Xóa L2 (Redis Key)
        try {
            redisCommands.getdel(redisKeyPrefix + username);
        } catch (Exception e) {
            LOG.errorf("Lỗi xóa Redis key: %s", e.getMessage());
        }

        // 2. Xóa L1 trên chính Pod hiện tại
        localCache.invalidate(username);

        // 3. Bắn event qua Redis Pub/Sub để các Pod khác cùng xóa L1
        try {
            pubsubCommands.publish(invalidationChannel, new CacheInvalidationEvent(username, reason));
            LOG.infof("[PUBSUB-PUBLISH] Đã gửi lệnh xóa L1 Cache toàn cụm cho user: %s", username);
        } catch (Exception e) {
            LOG.errorf("Không thể phát sự kiện Pub/Sub: %s", e.getMessage());
        }
    }

    private UserSecurityProfile loadFromDatabase(String username) {
        User user = User.<User>find("username = ?1 and isDeleted = false", username)
                .firstResultOptional()
                .orElse(null);

        if (user == null)
            return null;

        List<RolePermission> rolePermissions = RolePermission.find(
                "role.id in (select r.id from User u join u.roles r where u.id = ?1) and isDeleted = false",
                user.id).list();

        List<PermissionScopeDto> permissions = rolePermissions.stream()
                .map(rp -> new PermissionScopeDto(rp.permission.code, rp.dataScope))
                .toList();

        return new UserSecurityProfile(
                user.id,
                user.tenantId,
                user.username,
                user.department != null ? user.department.id : null,
                permissions);
    }

    public Optional<DataScope> resolveDataScope(UserSecurityProfile profile, PermissionCode requiredPermission) {
        List<DataScope> scopes = profile.permissions().stream()
                .filter(p -> p.code() == requiredPermission)
                .map(PermissionScopeDto::dataScope)
                .toList();

        if (scopes.isEmpty())
            return Optional.empty();
        if (scopes.contains(DataScope.ALL))
            return Optional.of(DataScope.ALL);
        if (scopes.contains(DataScope.DEPARTMENT))
            return Optional.of(DataScope.DEPARTMENT);
        return Optional.of(DataScope.PERSONAL);
    }
}