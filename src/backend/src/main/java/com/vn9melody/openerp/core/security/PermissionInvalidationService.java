package com.vn9melody.openerp.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.core.security.events.PermissionInvalidationEvent;
import com.vn9melody.openerp.core.security.events.PermissionInvalidationPayload;
import io.quarkus.redis.datasource.ReactiveRedisDataSource;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Event-driven invalidation of the Redis security context cache.
 *
 * <p>Publishes on the Redis Pub/Sub channel {@code openerp.iam.permission-invalidations}
 * with payload {@code {tenant_id, affected_user_ids[], reason}} and deletes the
 * {@code sec:ctx:{tenant_id}:{user_id}} keys for every subscriber node (SOL-02 section 6).</p>
 */
@ApplicationScoped
public class PermissionInvalidationService {

    public static final String CHANNEL = "openerp.iam.permission-invalidations";
    private static final String CONTEXT_KEY_PREFIX = "sec:ctx:";

    private static final Logger LOG = Logger.getLogger(PermissionInvalidationService.class);

    @Inject
    RedisDataSource redis;

    @Inject
    ReactiveRedisDataSource reactiveRedis;

    @Inject
    ObjectMapper objectMapper;

    void onStart(@Observes StartupEvent event) {
        subscribe();
    }

    public void subscribe() {
        reactiveRedis.pubsub(String.class)
            .subscribe(CHANNEL, this::handleInvalidationPayload)
            .subscribe().with(
                subscriber -> LOG.infof("Permission invalidation subscriber ready on channel %s", CHANNEL),
                failure -> LOG.errorf(failure, "Permission invalidation subscriber failed to start"));
    }

    public void publish(PermissionInvalidationEvent event) {
        if (event == null || event.tenantId() == null) {
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(PermissionInvalidationPayload.from(event));
            redis.pubsub(String.class).publish(CHANNEL, payload);
            LOG.debugf("Published permission invalidation for tenant %s (%s affected user(s))",
                event.tenantId(), event.affectedUserIds() != null ? event.affectedUserIds().size() : 0);
        } catch (Exception e) {
            LOG.warnf(e, "Unable to publish permission invalidation event");
        }
    }

    public void handleInvalidationPayload(String payload) {
        if (payload == null || payload.isBlank()) {
            return;
        }
        try {
            PermissionInvalidationPayload parsed = objectMapper.readValue(payload, PermissionInvalidationPayload.class);
            if (parsed.tenantId() == null) {
                return;
            }
            UUID tenantId = UUID.fromString(parsed.tenantId());
            List<UUID> userIds = parsed.affectedUserIds() == null
                ? List.of()
                : parsed.affectedUserIds().stream()
                    .filter(Objects::nonNull)
                    .map(UUID::fromString)
                    .toList();
            invalidate(tenantId, userIds);
        } catch (Exception e) {
            LOG.warnf(e, "Ignoring malformed permission invalidation payload");
        }
    }

    public void invalidate(UUID tenantId, List<UUID> userIds) {
        if (tenantId == null || userIds == null || userIds.isEmpty()) {
            return;
        }
        String[] keys = userIds.stream()
            .filter(Objects::nonNull)
            .distinct()
            .map(userId -> contextKey(tenantId, userId))
            .toArray(String[]::new);
        if (keys.length == 0) {
            return;
        }
        reactiveRedis.key(String.class).del(keys)
            .subscribe().with(
                deleted -> LOG.debugf("Permission invalidation deleted %s context key(s)", deleted),
                failure -> LOG.warnf(failure, "Unable to delete permission context keys"));
    }

    public String contextKey(UUID tenantId, UUID userId) {
        return CONTEXT_KEY_PREFIX + tenantId + ":" + userId;
    }
}
