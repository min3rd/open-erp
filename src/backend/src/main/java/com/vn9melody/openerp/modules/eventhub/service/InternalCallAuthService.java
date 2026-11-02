package com.vn9melody.openerp.modules.eventhub.service;

import com.vn9melody.openerp.core.api.ApiException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Auth for plugin→core internal HTTP calls (Sprint 08). Two accepted
 * identities: (a) the shared fanout token injected into every plugin
 * container (PLUGIN_FANOUT_TOKEN / openerp.plugin.fanout.token), with the
 * tenant taken from the X-Tenant-Id header the plugin copies from its own
 * TenantContext; (b) a short-lived plugin service JWT. Production hardening
 * (mTLS between plugins and core) is tracked for the next hardening pass.
 */
@ApplicationScoped
public class InternalCallAuthService {

    @ConfigProperty(name = "openerp.plugin.fanout.token", defaultValue = "")
    String fanoutToken;

    public boolean fanoutTokenValid(String presented) {
        return fanoutToken != null && !fanoutToken.isBlank()
                && fanoutToken.equals(presented);
    }

    public ApiException unauthorized() {
        return new ApiException(401, "UNAUTHORIZED",
                "Internal call requires a valid service or fanout token");
    }
}
