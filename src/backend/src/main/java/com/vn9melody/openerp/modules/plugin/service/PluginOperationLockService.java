package com.vn9melody.openerp.modules.plugin.service;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.UUID;

/**
 * Distributed lock per (tenant, plugin) preventing concurrent lifecycle
 * operations (BR-PLG-15). TTL protects against crashed holders.
 */
@ApplicationScoped
public class PluginOperationLockService {

    private static final long TTL_SECONDS = 300;
    private static final String PREFIX = "plugin:lock:";

    @Inject
    RedisDataSource redis;

    public String tryLock(UUID tenantId, String pluginKey) {
        String key = key(tenantId, pluginKey);
        String token = UUID.randomUUID().toString();
        boolean acquired = valueCommands().setnx(key, token);
        if (!acquired) {
            return null;
        }
        keyCommands().expire(key, TTL_SECONDS);
        return token;
    }

    public void release(UUID tenantId, String pluginKey, String token) {
        if (token == null) {
            return;
        }
        String key = key(tenantId, pluginKey);
        String current = valueCommands().get(key);
        if (token.equals(current)) {
            keyCommands().del(key);
        }
    }

    private String key(UUID tenantId, String pluginKey) {
        return PREFIX + tenantId + ":" + pluginKey;
    }

    private ValueCommands<String, String> valueCommands() {
        return redis.value(String.class);
    }

    private KeyCommands<String> keyCommands() {
        return redis.key(String.class);
    }
}
