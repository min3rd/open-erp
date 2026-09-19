package com.vn9melody.openerp.modules.platform.service;

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
 * Background sweeper for abandoned impersonation sessions (BUG-78 / BUG-82 / TC-BE-19).
 * Overdue STARTED logs become TIMEOUT with a SYSTEM audit entry; idempotent and
 * disabled in the test profile (tests invoke the service directly).
 */
@ApplicationScoped
public class ImpersonationTimeoutJob {

    private static final Logger LOG = Logger.getLogger(ImpersonationTimeoutJob.class);

    @Inject
    ImpersonationService impersonationService;

    @Inject
    Vertx vertx;

    @ConfigProperty(name = "openerp.platform.impersonation.jobs-enabled", defaultValue = "true")
    boolean jobsEnabled;

    @ConfigProperty(name = "openerp.platform.impersonation.interval-seconds", defaultValue = "300")
    long intervalSeconds;

    void onStart(@Observes StartupEvent event) {
        if (!jobsEnabled) {
            return;
        }
        vertx.setPeriodic(intervalSeconds * 1000L, id -> sweepNow());
    }

    /**
     * BUG-82: runs one sweep on a Vert.x worker thread. The periodic timer fires on the
     * event loop, where {@code QuarkusTransaction.requiringNew()} throws
     * "Cannot start a JTA transaction from the IO thread" — so the transaction is opened
     * inside the worker callback. Any failure is logged and swallowed; a bad tick must
     * never kill the scheduler or throw on the event loop.
     */
    public Future<Integer> sweepNow() {
        return vertx.executeBlocking(() -> {
            try {
                return QuarkusTransaction.requiringNew().call(this::runTimeoutSweep);
            } catch (Exception e) {
                LOG.errorf("Impersonation timeout job failed: %s", e.getMessage());
                return 0;
            }
        });
    }

    /** Closes every overdue impersonation session; returns the number closed. */
    public int runTimeoutSweep() {
        return impersonationService.closeExpiredSessions(Instant.now());
    }
}
