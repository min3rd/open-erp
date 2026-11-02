package com.vn9melody.openerp.modules.eventhub.service;

import com.vn9melody.openerp.core.api.ApiException;
import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * IP rate limit for public (anonymous) plugin surfaces (ADR-S08-003 §2.4).
 * Same Redis incr pattern as TenantSwitchRateLimiter.
 */
@ApplicationScoped
public class PluginPublicRateLimiter {

    private static final long WINDOW_SECONDS = 60;

    @Inject
    RedisDataSource redis;

    @ConfigProperty(name = "openerp.public.rate-limit.per-minute", defaultValue = "60")
    int maxPerMinute;

    /** Throws 429 PUBLIC_RATE_LIMITED when the IP exceeds the window budget. */
    public void check(String clientIp) {
        if (clientIp == null || clientIp.isBlank() || maxPerMinute <= 0) {
            return;
        }
        String key = "public:ratelimit:" + clientIp;
        long count = redis.value(String.class).incr(key);
        if (count == 1) {
            redis.key(String.class).expire(key, WINDOW_SECONDS);
        }
        if (count > maxPerMinute) {
            throw new ApiException(429, "PUBLIC_RATE_LIMITED",
                    "Too many public requests from this address");
        }
    }
}
