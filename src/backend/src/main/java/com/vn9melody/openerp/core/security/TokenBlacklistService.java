package com.vn9melody.openerp.core.security;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class TokenBlacklistService {

    @Inject
    RedisDataSource redis;

    public void blacklist(String jti, long ttlSeconds) {
        if (jti == null || jti.isBlank() || ttlSeconds <= 0) {
            return;
        }
        valueCommands().setex(blacklistKey(jti), ttlSeconds, "1");
    }

    public boolean isBlacklisted(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        return valueCommands().get(blacklistKey(jti)) != null;
    }

    private String blacklistKey(String jti) {
        return "blacklist:token:" + jti;
    }

    private ValueCommands<String, String> valueCommands() {
        return redis.value(String.class);
    }
}
