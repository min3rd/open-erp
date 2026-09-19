package com.vn9melody.openerp.modules.platform.service;

import com.vn9melody.openerp.core.enums.TenantStatus;
import com.vn9melody.openerp.modules.iam.model.Tenant;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.dto.PlatformResponses;
import io.quarkus.redis.datasource.RedisDataSource;
import io.vertx.mutiny.redis.client.Response;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.jboss.logging.Logger;

/**
 * Infrastructure health aggregation for the platform portal (FEAT-12 / BUG-64).
 * PostgreSQL primary and Redis are mandatory; replica and Kafka are optional and
 * degrade (never down) the overall status when missing in the minimal dev profile.
 */
@ApplicationScoped
public class PlatformHealthService {

    private static final Logger LOG = Logger.getLogger(PlatformHealthService.class);

    public static final String UP = "UP";
    public static final String DOWN = "DOWN";
    public static final String UNKNOWN = "UNKNOWN";
    public static final String HEALTHY = "HEALTHY";
    public static final String DEGRADED = "DEGRADED";

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    public PlatformResponses.Health health() {
        PlatformResponses.Health health = new PlatformResponses.Health();
        health.database = databaseHealth();
        health.redis = redisHealth();
        health.kafka = kafkaHealth();
        health.platformMetrics = metrics();

        boolean dbDown = DOWN.equals(health.database.primary);
        boolean redisDown = DOWN.equals(health.redis.status);
        if (dbDown || redisDown) {
            health.systemStatus = DOWN;
        } else if (!UP.equals(health.database.replica) || !UP.equals(health.kafka.status)) {
            health.systemStatus = DEGRADED;
        } else {
            health.systemStatus = HEALTHY;
        }
        return health;
    }

    public PlatformResponses.DatabaseHealth databaseHealth() {
        PlatformResponses.DatabaseHealth db = new PlatformResponses.DatabaseHealth();
        try {
            Object probe = entityManager.createNativeQuery("SELECT 1").getSingleResult();
            db.primary = probe != null ? UP : DOWN;
        } catch (Exception e) {
            db.primary = DOWN;
        }

        try {
            Object inRecovery = entityManager.createNativeQuery("SELECT pg_is_in_recovery()").getSingleResult();
            boolean replica = inRecovery instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(inRecovery));
            if (replica) {
                db.replica = UP;
                try {
                    Object lag = entityManager.createNativeQuery(
                        "SELECT COALESCE(pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()), 0)")
                        .getSingleResult();
                    db.replicationLagMs = lag != null ? ((Number) lag).longValue() / 1024L : 0L;
                } catch (Exception e) {
                    db.replicationLagMs = 0L;
                }
            } else {
                db.replica = UNKNOWN;
            }
        } catch (Exception e) {
            db.replica = UNKNOWN;
        }

        try {
            Object active = entityManager.createNativeQuery(
                "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()").getSingleResult();
            db.activeConnections = active != null ? ((Number) active).intValue() : 0;
        } catch (Exception e) {
            db.activeConnections = 0;
        }
        try {
            Object max = entityManager.createNativeQuery("SHOW max_connections").getSingleResult();
            db.maxConnections = max != null ? Integer.parseInt(max.toString()) : null;
        } catch (Exception e) {
            db.maxConnections = null;
        }
        return db;
    }

    public PlatformResponses.RedisHealth redisHealth() {
        PlatformResponses.RedisHealth health = new PlatformResponses.RedisHealth();
        String probeKey = "health:platform:" + java.util.UUID.randomUUID();
        try {
            redis.value(String.class).setex(probeKey, 5, "1");
            String value = redis.value(String.class).get(probeKey);
            health.status = "1".equals(value) ? UP : DOWN;
        } catch (Exception e) {
            LOG.warnf("Redis health probe failed: %s", e.getMessage());
            health.status = DOWN;
        }
        try {
            Response info = redis.execute("INFO");
            String text = info != null ? info.toString() : "";
            for (String line : text.split("\\r?\\n")) {
                if (line.startsWith("used_memory_human:")) {
                    health.usedMemoryHuman = line.substring("used_memory_human:".length()).trim();
                } else if (line.startsWith("connected_clients:")) {
                    health.connectedClients = Integer.parseInt(line.substring("connected_clients:".length()).trim());
                }
            }
        } catch (Exception e) {
            LOG.debugf("Redis INFO unavailable: %s", e.getMessage());
        }
        return health;
    }

    public PlatformResponses.KafkaHealth kafkaHealth() {
        PlatformResponses.KafkaHealth kafka = new PlatformResponses.KafkaHealth();
        // Kafka is an optional compose profile: absent broker means UNKNOWN (DEGRADED), never DOWN.
        kafka.status = UNKNOWN;
        kafka.clusterId = null;
        kafka.nodesCount = 0;
        return kafka;
    }

    public PlatformResponses.PlatformMetrics metrics() {
        PlatformResponses.PlatformMetrics metrics = new PlatformResponses.PlatformMetrics();
        metrics.totalTenants = Tenant.count();
        metrics.activeTenants = Tenant.count("status = ?1", TenantStatus.ACTIVE);
        metrics.suspendedTenants = Tenant.count("status = ?1", TenantStatus.SUSPENDED);
        metrics.totalUsers = User.count();
        try {
            List<String> sessions = redis.key(String.class).keys("session:*");
            metrics.activeSessionsNow = sessions != null ? (long) sessions.size() : 0L;
        } catch (Exception e) {
            metrics.activeSessionsNow = 0L;
        }
        return metrics;
    }
}
