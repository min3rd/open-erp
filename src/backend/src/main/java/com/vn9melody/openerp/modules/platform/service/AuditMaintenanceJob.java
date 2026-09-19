package com.vn9melody.openerp.modules.platform.service;

import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Monthly audit partitions + 24 month hot retention (TASK-292 / SOL-01 3.4/3.7).
 * Scheduling uses Vert.x periodic timers because the local minimal footprint does
 * not include the Quarkus scheduler extension.
 */
@ApplicationScoped
public class AuditMaintenanceJob {

    private static final Logger LOG = Logger.getLogger(AuditMaintenanceJob.class);
    private static final Pattern PARTITION_PATTERN = Pattern.compile("platform_audit_logs_(\\d{4})_(\\d{2})");
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy_MM");

    @Inject
    EntityManager entityManager;

    @Inject
    Vertx vertx;

    @ConfigProperty(name = "openerp.platform.audit.partition-interval-seconds", defaultValue = "86400")
    long partitionIntervalSeconds;

    @ConfigProperty(name = "openerp.platform.audit.retention-interval-seconds", defaultValue = "2592000")
    long retentionIntervalSeconds;

    @ConfigProperty(name = "openerp.platform.audit.retention-months", defaultValue = "24")
    int retentionMonths;

    @ConfigProperty(name = "openerp.platform.audit.jobs-enabled", defaultValue = "true")
    boolean jobsEnabled;

    void onStart(@Observes StartupEvent event) {
        if (!jobsEnabled) {
            return;
        }
        vertx.setTimer(300_000L, id -> runPartitionMaintenance());
        vertx.setPeriodic(partitionIntervalSeconds * 1000L, id -> runPartitionMaintenance());
        vertx.setPeriodic(retentionIntervalSeconds * 1000L, id -> runRetentionMaintenance());
        LOG.info("Audit partition/retention timers registered");
    }

    /**
     * BUG-82: one partition pass on a Vert.x worker thread. Timer callbacks run on the
     * event loop, where a JTA transaction cannot start, so the transaction is opened
     * inside the worker callback; failures are logged and swallowed.
     */
    public Future<Integer> runPartitionMaintenance() {
        return runOnWorker(() -> ensureFuturePartitions(3), "partition");
    }

    /** BUG-82: one retention pass on a Vert.x worker thread (same contract as above). */
    public Future<Integer> runRetentionMaintenance() {
        return runOnWorker(() -> runRetention(retentionMonths), "retention");
    }

    private Future<Integer> runOnWorker(Callable<Integer> action, String name) {
        return vertx.executeBlocking(() -> {
            try {
                return QuarkusTransaction.requiringNew().call(action);
            } catch (Exception e) {
                LOG.errorf("Audit maintenance job failed (%s): %s", name, e.getMessage());
                return 0;
            }
        });
    }

    @Transactional
    public int ensureFuturePartitions(int monthsAhead) {
        YearMonth start = YearMonth.now(ZoneOffset.UTC);
        int created = 0;
        for (int i = 0; i < Math.max(monthsAhead, 1); i++) {
            YearMonth month = start.plusMonths(i);
            String name = "platform_audit_logs_" + month.format(MONTH_FORMAT);
            if (partitionExists(name)) {
                continue;
            }
            String from = month.atDay(1).toString() + " 00:00:00+00";
            String to = month.plusMonths(1).atDay(1).toString() + " 00:00:00+00";
            entityManager.createNativeQuery(String.format(
                "CREATE TABLE IF NOT EXISTS %s PARTITION OF platform_audit_logs FOR VALUES FROM ('%s') TO ('%s')",
                name, from, to)).executeUpdate();
            created++;
            LOG.infof("Created audit partition %s", name);
        }
        ensureDefaultPartition();
        return created;
    }

    @Transactional
    public int runRetention(int months) {
        YearMonth cutoff = YearMonth.now(ZoneOffset.UTC).minusMonths(months);
        List<String> partitions = findPartitions();
        int dropped = 0;
        for (String name : partitions) {
            Matcher matcher = PARTITION_PATTERN.matcher(name);
            if (!matcher.matches()) {
                continue;
            }
            YearMonth partitionMonth = YearMonth.of(
                Integer.parseInt(matcher.group(1)), Integer.parseInt(matcher.group(2)));
            if (partitionMonth.plusMonths(1).isAfter(cutoff)) {
                continue;
            }
            long rows = countRows(name);
            entityManager.createNativeQuery("DROP TABLE IF EXISTS " + name).executeUpdate();
            dropped++;
            LOG.warnf("Dropped expired audit partition %s (%d rows) older than %d months",
                name, rows, months);
        }
        return dropped;
    }

    public List<String> findPartitions() {
        List<?> rows = entityManager.createNativeQuery("""
                SELECT c.relname FROM pg_class c
                JOIN pg_inherits i ON i.inhrelid = c.oid
                JOIN pg_class p ON p.oid = i.inhparent
                WHERE p.relname = 'platform_audit_logs'
                """).getResultList();
        List<String> names = new ArrayList<>();
        for (Object row : rows) {
            names.add(row.toString());
        }
        return names;
    }

    private boolean partitionExists(String name) {
        List<?> rows = entityManager.createNativeQuery("SELECT 1 FROM pg_class WHERE relname = :name")
            .setParameter("name", name)
            .getResultList();
        return !rows.isEmpty();
    }

    private void ensureDefaultPartition() {
        if (!partitionExists("platform_audit_logs_default")) {
            entityManager.createNativeQuery(
                "CREATE TABLE platform_audit_logs_default PARTITION OF platform_audit_logs DEFAULT")
                .executeUpdate();
        }
    }

    private long countRows(String partition) {
        try {
            Object count = entityManager.createNativeQuery("SELECT count(*) FROM " + partition).getSingleResult();
            return count != null ? ((Number) count).longValue() : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }
}
