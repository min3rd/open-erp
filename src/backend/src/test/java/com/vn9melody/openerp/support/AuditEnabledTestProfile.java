package com.vn9melody.openerp.support;

import io.quarkus.test.junit.QuarkusTestProfile;
import java.util.HashMap;
import java.util.Map;

/**
 * Wave 3A profile enabling the tenant-scope audit bridge so tests can assert that
 * enforcement/write events land in {@code platform_audit_logs}. Inherits the S2IAM
 * port/Redis overrides and cleanup conventions.
 */
public class AuditEnabledTestProfile implements QuarkusTestProfile {

    @Override
    public Map<String, String> getConfigOverrides() {
        Map<String, String> overrides = new HashMap<>(new S2IamTestProfile().getConfigOverrides());
        overrides.put("openerp.platform.audit.recorder-enabled", "true");
        return overrides;
    }
}
