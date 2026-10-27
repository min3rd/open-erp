package com.vn9melody.openerp.plugins.catalog.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import java.util.function.Supplier;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Catalog-owned Redis read cache. The plugin controls its namespace, TTL and
 * invalidation; core knows nothing about catalog cache keys (SOL-S05-002 Q12).
 *
 * <p>Cache keys include a per-tenant generation. Writes increment the
 * generation, which invalidates every entry for that tenant without SCAN/KEYS.
 * Redis failures never fail a read: the loader result is returned.</p>
 */
@ApplicationScoped
public class CatalogCache {

    private static final Logger LOG = Logger.getLogger(CatalogCache.class);
    private static final String NAMESPACE = "plugin:catalog";

    @Inject
    RedisDataSource redis;

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "catalog.cache.enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "catalog.cache.ttl-seconds", defaultValue = "60")
    long ttlSeconds;

    public <T> T getOrLoad(UUID tenantId, String name, TypeReference<T> type, Supplier<T> loader) {
        if (!enabled) {
            return loader.get();
        }
        String key = key(tenantId, name);
        try {
            String cached = values().get(key);
            if (cached != null) {
                return objectMapper.readValue(cached, type);
            }
        } catch (Exception e) {
            LOG.debugf("Catalog cache read skipped tenant=%s key=%s: %s", tenantId, name, e.getMessage());
        }
        T value = loader.get();
        try {
            values().setex(key, Math.max(1, ttlSeconds), objectMapper.writeValueAsString(value));
        } catch (Exception e) {
            LOG.debugf("Catalog cache write skipped tenant=%s key=%s: %s", tenantId, name, e.getMessage());
        }
        return value;
    }

    /** Invalidate all catalog reads for one tenant by rotating its generation. */
    public void invalidate(UUID tenantId) {
        if (!enabled) {
            return;
        }
        try {
            values().incr(generationKey(tenantId));
        } catch (Exception e) {
            LOG.debugf("Catalog cache invalidation skipped tenant=%s: %s", tenantId, e.getMessage());
        }
    }

    private String key(UUID tenantId, String name) {
        String generation;
        try {
            String current = values().get(generationKey(tenantId));
            generation = current == null ? "0" : current;
        } catch (Exception e) {
            generation = "0";
        }
        return NAMESPACE + ":" + tenantKey(tenantId) + ":g" + generation + ":" + name;
    }

    private String generationKey(UUID tenantId) {
        return NAMESPACE + ":" + tenantKey(tenantId) + ":gen";
    }

    private ValueCommands<String, String> values() {
        return redis.value(String.class);
    }

    private static String tenantKey(UUID tenantId) {
        return tenantId == null ? "system" : tenantId.toString();
    }

    /** Stable short key segment for parameter tuples. */
    public static String hash(Object... parts) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            for (Object part : parts) {
                digest.update(String.valueOf(part).getBytes(StandardCharsets.UTF_8));
                digest.update((byte) '|');
            }
            return HexFormat.of().formatHex(digest.digest()).substring(0, 24);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
