package com.vn9melody.openerp.modules.iam.service;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

/**
 * Runs the role data-policy backfill once at startup so tenants created before the
 * deny-by-default engine was wired keep working after an upgrade (BUG-117 follow-up).
 * Never blocks startup: failures are logged and the app still boots.
 */
@ApplicationScoped
public class RoleDataPolicyBackfillJob {

    private static final Logger LOG = Logger.getLogger(RoleDataPolicyBackfillJob.class);

    @Inject
    RoleDataPolicyProvisioningService provisioning;

    void onStart(@Observes StartupEvent event) {
        try {
            provisioning.provisionAllTenants();
        } catch (Exception e) {
            LOG.errorf("Role data-policy backfill failed (continuing startup): %s", e.getMessage());
        }
    }
}
