package com.vn9melody.openerp.modules.platform;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn9melody.openerp.modules.platform.service.AuditMaintenanceJob;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BUG-82 regression: the audit partition/retention timers now open their JTA
 * transaction inside a Vert.x worker callback. This smoke test runs one pass of each
 * job directly and asserts they complete instead of blowing up.
 */
@QuarkusTest
public class AuditMaintenanceJobTest {

    @Inject
    AuditMaintenanceJob auditMaintenanceJob;

    @Test
    @DisplayName("BUG-82: job audit partition + retention chạy 1 lượt qua worker không crash")
    public void testMaintenancePassesRunOnWorker() throws Exception {
        Integer created = auditMaintenanceJob.runPartitionMaintenance()
            .toCompletionStage().toCompletableFuture().get(30, TimeUnit.SECONDS);
        assertNotNull(created, "partition pass must return a count");
        assertTrue(created >= 0);

        Integer dropped = auditMaintenanceJob.runRetentionMaintenance()
            .toCompletionStage().toCompletableFuture().get(30, TimeUnit.SECONDS);
        assertNotNull(dropped, "retention pass must return a count");
        assertTrue(dropped >= 0);
    }
}
