package com.vn9melody.openerp.core.security;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.keys.RedisKeyNotFoundException;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class BruteForceService {
    private static final int MAX_ATTEMPTS = 5;
    private static final long ATTEMPT_WINDOW_SECONDS = 600; // 10 minutes sliding window
    private static final long LOCK_DURATION_SECONDS = 900; // 15 minutes

    @Inject
    RedisDataSource redis;

    public boolean isLocked(String email) {
        if (email == null) {
            return false;
        }
        return valueCommands().get(lockKey(email)) != null;
    }

    public long getRemainingLockSeconds(String email) {
        if (email == null) {
            return 0;
        }
        try {
            long ttl = keyCommands().ttl(lockKey(email));
            return ttl > 0 ? ttl : 0;
        } catch (RedisKeyNotFoundException e) {
            return 0;
        }
    }

    public void recordFailedAttempt(String email) {
        if (email == null) {
            return;
        }
        String attemptsKey = attemptsKey(email);
        long attempts = valueCommands().incr(attemptsKey);
        if (attempts == 1) {
            keyCommands().expire(attemptsKey, ATTEMPT_WINDOW_SECONDS);
        }
        if (attempts >= MAX_ATTEMPTS) {
            valueCommands().setex(lockKey(email), LOCK_DURATION_SECONDS, "1");
        }
    }

    public void resetAttempts(String email) {
        if (email == null) {
            return;
        }
        keyCommands().del(attemptsKey(email), lockKey(email));
    }

    private String attemptsKey(String email) {
        return "bruteforce:attempts:" + email.toLowerCase().trim();
    }

    private String lockKey(String email) {
        return "bruteforce:lock:" + email.toLowerCase().trim();
    }

    private ValueCommands<String, String> valueCommands() {
        return redis.value(String.class);
    }

    private KeyCommands<String> keyCommands() {
        return redis.key(String.class);
    }
}
