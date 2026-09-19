package com.vn9melody.openerp.support;

import io.quarkus.test.junit.QuarkusTestProfile;
import java.util.Map;

/**
 * Wave 2C test profile. Overrides platform bootstrap configuration so the shared test
 * application boots even while the platform module registers empty-value config defaults.
 */
public class S2IamTestProfile implements QuarkusTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        return Map.of(
            "openerp.platform.bootstrap-emails", "s2iam-none@example.com",
            "openerp.platform.bootstrap-secret", "s2iam-test-secret",
            "openerp.platform.audit.jobs-enabled", "false",
            "openerp.platform.lifecycle.jobs-enabled", "false",
            "quarkus.http.test-port", "8093",
            "quarkus.redis.hosts", "redis://:openerp_redis_password@localhost:6379/2"
        );
    }
}
