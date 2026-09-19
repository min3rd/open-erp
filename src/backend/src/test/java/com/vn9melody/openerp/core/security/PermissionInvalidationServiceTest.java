package com.vn9melody.openerp.core.security;

import com.vn9melody.openerp.core.security.events.BranchAssignmentChangedEvent;
import com.vn9melody.openerp.core.security.events.UserRoleAssignedEvent;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class PermissionInvalidationServiceTest {

    private static final long TIMEOUT_NANOS = TimeUnit.SECONDS.toNanos(10);

    @Inject
    PermissionInvalidationService permissionInvalidationService;

    @Inject
    RedisDataSource redis;

    @Test
    @DisplayName("SOL-02 §6: key ngữ cảnh bảo mật đúng định dạng sec:ctx:{tenant}:{user}")
    public void testContextKeyFormat() {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Assertions.assertEquals("sec:ctx:" + tenantId + ":" + userId,
            permissionInvalidationService.contextKey(tenantId, userId));
    }

    @Test
    @DisplayName("SOL-02 §6: payload Pub/Sub xóa mọi key ngữ cảnh bị ảnh hưởng")
    public void testHandleInvalidationPayloadDeletesKeys() throws InterruptedException {
        UUID tenantId = UUID.randomUUID();
        UUID userA = UUID.randomUUID();
        UUID userB = UUID.randomUUID();
        redis.value(String.class).set(permissionInvalidationService.contextKey(tenantId, userA), "{}");
        redis.value(String.class).set(permissionInvalidationService.contextKey(tenantId, userB), "{}");

        permissionInvalidationService.handleInvalidationPayload(
            "{\"tenant_id\":\"" + tenantId + "\",\"affected_user_ids\":[\"" + userA + "\",\"" + userB + "\"],\"reason\":\"TEST\"}");

        awaitContextDeleted(tenantId, userA, userB);
    }

    @Test
    @DisplayName("SOL-02 §6: publish event qua Redis Pub/Sub channel openerp.iam.permission-invalidations")
    public void testPublishRoundTripInvalidatesContext() throws InterruptedException {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();
        redis.value(String.class).set(permissionInvalidationService.contextKey(tenantId, userId), "{}");

        permissionInvalidationService.publish(new UserRoleAssignedEvent(tenantId, userId, roleId, true, "TEST"));

        awaitContextDeleted(tenantId, userId);
    }

    @Test
    @DisplayName("SOL-02 §6: sự kiện chuyển giao quản lý chi nhánh cũng vô hiệu hóa cache")
    public void testBranchAssignmentEventInvalidatesContext() throws InterruptedException {
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID branchId = UUID.randomUUID();
        redis.value(String.class).set(permissionInvalidationService.contextKey(tenantId, userId), "{}");

        permissionInvalidationService.publish(new BranchAssignmentChangedEvent(tenantId, userId, branchId, "TEST"));

        awaitContextDeleted(tenantId, userId);
    }

    private void awaitContextDeleted(UUID tenantId, UUID... userIds) throws InterruptedException {
        long deadline = System.nanoTime() + TIMEOUT_NANOS;
        while (System.nanoTime() < deadline) {
            boolean allDeleted = true;
            for (UUID userId : userIds) {
                if (redis.value(String.class).get(permissionInvalidationService.contextKey(tenantId, userId)) != null) {
                    allDeleted = false;
                    break;
                }
            }
            if (allDeleted) {
                return;
            }
            Thread.sleep(50);
        }
        Assertions.fail("Key sec:ctx chưa bị xóa sau " + TimeUnit.NANOSECONDS.toSeconds(TIMEOUT_NANOS) + "s");
    }
}
