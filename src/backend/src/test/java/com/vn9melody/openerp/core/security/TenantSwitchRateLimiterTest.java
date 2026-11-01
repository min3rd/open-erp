package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.api.ApiException;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

@QuarkusTest
class TenantSwitchRateLimiterTest {

    @Inject
    TenantSwitchRateLimiter limiter;

    @Test
    void blocksAfterTenSwitchesInWindow() {
        UUID userId = UUID.randomUUID();
        for (int i = 0; i < 10; i++) {
            limiter.check(userId);
        }
        ApiException error = Assertions.assertThrows(ApiException.class,
            () -> limiter.check(userId));
        Assertions.assertEquals(429, error.getStatusCode());
        Assertions.assertEquals("AUTH_TENANT_SWITCH_RATE_LIMITED", error.getErrorCode());
    }
}
