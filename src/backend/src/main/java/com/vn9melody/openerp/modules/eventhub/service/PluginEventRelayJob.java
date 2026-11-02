package com.vn9melody.openerp.modules.eventhub.service;

import io.quarkus.runtime.StartupEvent;
import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Event Hub relay timer. Uses the same Vert.x periodic pattern as the other
 * core jobs (the minimal local footprint does not include the Quarkus
 * scheduler extension). Idempotent on both ends, so an occasional double pass
 * is harmless.
 */
@ApplicationScoped
public class PluginEventRelayJob {

    private static final Logger LOG = Logger.getLogger(PluginEventRelayJob.class);

    @Inject
    Vertx vertx;

    @Inject
    PluginEventHubService hubService;

    @ConfigProperty(name = "openerp.eventhub.relay.enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "openerp.eventhub.relay.interval-seconds", defaultValue = "10")
    long intervalSeconds;

    void onStart(@Observes StartupEvent event) {
        if (!enabled) {
            return;
        }
        vertx.setPeriodic(intervalSeconds * 1000L, id -> vertx.executeBlocking(() -> {
            // Panache needs an active transaction: same pattern as
            // AuditMaintenanceJob (BUG-82) — open it on the worker thread.
            try {
                return io.quarkus.narayana.jta.QuarkusTransaction.requiringNew().call(() -> {
                    hubService.relayPending();
                    return 0;
                });
            } catch (Exception e) {
                LOG.errorf("Event hub relay pass failed: %s", e.getMessage());
                return 0;
            }
        }));
        LOG.info("Plugin event hub relay timer registered");
    }
}
