package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Map;
import java.util.UUID;

/** TASK-437: per-user tenant-switch rate limit (10 switches / 60s). */
@ApplicationScoped
public class TenantSwitchRateLimiter {

    private static final int MAX_SWITCHES = 10;
    private static final long WINDOW_SECONDS = 60;

    @Inject
    RedisDataSource redis;

    public void check(UUID userId) {
        if (userId == null) {
            return;
        }
        String key = "auth:switch:" + userId;
        long count = redis.value(String.class).incr(key);
        if (count == 1) {
            redis.key(String.class).expire(key, WINDOW_SECONDS);
        }
        if (count > MAX_SWITCHES) {
            throw new ApiException(429, ErrorCode.AUTH_TENANT_SWITCH_RATE_LIMITED,
                "Too many tenant switches. Please retry later.",
                Map.of("limit", MAX_SWITCHES, "window_seconds", WINDOW_SECONDS));
        }
    }
}
