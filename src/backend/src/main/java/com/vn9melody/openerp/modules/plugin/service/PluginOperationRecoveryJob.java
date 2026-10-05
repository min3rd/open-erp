package com.vn9melody.openerp.modules.plugin.service;

import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.Future;
import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.time.Instant;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * TASK-312/346: periodic sweeper for abandoned plugin lifecycle sagas. Runs on a
 * Vert.x worker thread (the timer fires on the event loop, where a JTA
 * transaction cannot be started); disabled in the test profile, where tests call
 * {@link PluginOperationRecoveryService} directly.
 */
@ApplicationScoped
public class PluginOperationRecoveryJob {

    private static final Logger LOG = Logger.getLogger(PluginOperationRecoveryJob.class);

    @Inject
    PluginOperationRecoveryService recoveryService;

    @Inject
    Vertx vertx;

    @ConfigProperty(name = "openerp.plugin.recovery.jobs-enabled", defaultValue = "true")
    boolean jobsEnabled;

    @ConfigProperty(name = "openerp.plugin.recovery.interval-seconds", defaultValue = "300")
    long intervalSeconds;

    @ConfigProperty(name = "openerp.plugin.recovery.stale-minutes", defaultValue = "15")
    long staleMinutes;

    void onStart(@Observes StartupEvent event) {
        if (!jobsEnabled) {
            return;
        }
        vertx.setPeriodic(intervalSeconds * 1000L, id -> sweepNow());
    }

    public Future<Integer> sweepNow() {
        return vertx.executeBlocking(() -> {
            try {
                return QuarkusTransaction.requiringNew()
                        .call(() -> recoveryService.recoverStale(staleMinutes, Instant.now()));
            } catch (Exception e) {
                LOG.errorf("Plugin operation recovery job failed: %s", e.getMessage());
                return 0;
            }
        });
    }
}
