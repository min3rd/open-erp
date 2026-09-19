package com.vn9melody.openerp.modules.platform;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vn9melody.openerp.core.enums.AccountStatus;
import com.vn9melody.openerp.core.enums.ActorType;
import com.vn9melody.openerp.core.enums.AuditResult;
import com.vn9melody.openerp.core.enums.AuditScope;
import com.vn9melody.openerp.core.enums.PlatformAdminRole;
import com.vn9melody.openerp.core.enums.PlatformAdminStatus;
import com.vn9melody.openerp.core.security.PasswordHashService;
import com.vn9melody.openerp.modules.iam.model.User;
import com.vn9melody.openerp.modules.platform.api.PlatformErrorCode;
import com.vn9melody.openerp.modules.platform.model.PlatformAuditLog;
import com.vn9melody.openerp.modules.platform.service.AuditChainVerification;
import com.vn9melody.openerp.modules.platform.service.AuditChainVerifier;
import com.vn9melody.openerp.modules.platform.service.AuditLogEntry;
import com.vn9melody.openerp.modules.platform.service.AuditLogService;
import com.vn9melody.openerp.modules.platform.service.AuditMaintenanceJob;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
public class AuditChainTest {

    @Inject
    AuditLogService auditLogService;

    @Inject
    AuditChainVerifier auditChainVerifier;

    @Inject
    AuditMaintenanceJob auditMaintenanceJob;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    PasswordHashService passwordHashService;

    @Inject
    EntityManager entityManager;

    @Inject
    RedisDataSource redis;

    private UUID actorUserId;
    private UUID firstId;
    private UUID secondId;
    private UUID thirdId;

    @BeforeEach
    public void setup() {
        QuarkusTransaction.requiringNew().run(() -> {
            PlatformTestSupport.cleanup(entityManager);
            User actor = PlatformTestSupport.createUser(PlatformTestSupport.PREFIX + "audit-actor@example.com",
                AccountStatus.ACTIVE, passwordHashService);
            actorUserId = actor.id;
        });
        PlatformTestSupport.clearRedis(redis);
    }

    @AfterEach
    public void tearDown() {
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.cleanup(entityManager));
        PlatformTestSupport.clearRedis(redis);
    }

    private PlatformAuditLog record(String action, int index) {
        ObjectNode details = objectMapper.createObjectNode();
        details.put("index", index);
        return auditLogService.record(AuditLogEntry
            .of(AuditScope.PLATFORM, null, ActorType.SUPER_ADMIN, actorUserId, action, AuditResult.SUCCESS)
            .details(details)
            .reason("audit chain test " + index)
            .client("127.0.0.1", "junit"));
    }

    @Test
    @DisplayName("TASK-291/TC-BE-24: hash chain VERIFIED cho 3 bản ghi liên tiếp")
    public void testChainVerified() {
        PlatformAuditLog first = record("TENANT_LOCK", 1);
        PlatformAuditLog second = record("TENANT_UNLOCK", 2);
        PlatformAuditLog third = record("TENANT_QUOTA_UPDATE", 3);
        firstId = first.id;
        secondId = second.id;
        thirdId = third.id;

        assertNull(first.prevHash);
        assertEquals(first.entryHash, second.prevHash);
        assertEquals(second.entryHash, third.prevHash);
        assertNotNull(third.entryHash);

        AuditChainVerification verification =
            auditChainVerifier.verify(AuditScope.PLATFORM, null, null, null);
        assertEquals(AuditChainVerification.Status.VERIFIED, verification.status);
        assertEquals(3, verification.checkedCount);

        // API verify endpoint
        String token = loginPlatformAdmin();
        given().header("Authorization", "Bearer " + token)
            .when().get("/api/v1/platform/audit-logs/verify?scope=PLATFORM")
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_AUDIT_CHAIN_VERIFIED))
            .body("data.chain_status", equalTo("VERIFIED"))
            .body("data.checked_count", equalTo(3));
    }

    @Test
    @DisplayName("TASK-291/TC-BE-25: sửa trực tiếp bằng SQL → TAMPERED đúng vị trí")
    public void testTamperDetected() {
        record("TENANT_LOCK", 1);
        PlatformAuditLog second = record("TENANT_UNLOCK", 2);
        record("TENANT_QUOTA_UPDATE", 3);
        secondId = second.id;

        QuarkusTransaction.requiringNew().run(() -> {
            List<String> partitions = entityManager.createNativeQuery("""
                    SELECT c.relname FROM pg_class c
                    JOIN pg_inherits i ON i.inhrelid = c.oid
                    JOIN pg_class p ON p.oid = i.inhparent
                    WHERE p.relname = 'platform_audit_logs'
                    """).getResultList().stream().map(Object::toString).toList();
            entityManager.createNativeQuery(
                "ALTER TABLE platform_audit_logs DISABLE TRIGGER USER").executeUpdate();
            for (String partition : partitions) {
                entityManager.createNativeQuery(
                    "ALTER TABLE " + partition + " DISABLE TRIGGER USER").executeUpdate();
            }
            entityManager.createNativeQuery(
                    "UPDATE platform_audit_logs SET details = '{\"tampered\": true}'::jsonb WHERE id = :id")
                .setParameter("id", secondId)
                .executeUpdate();
            for (String partition : partitions) {
                entityManager.createNativeQuery(
                    "ALTER TABLE " + partition + " ENABLE TRIGGER USER").executeUpdate();
            }
            entityManager.createNativeQuery(
                "ALTER TABLE platform_audit_logs ENABLE TRIGGER USER").executeUpdate();
        });

        AuditChainVerification verification =
            auditChainVerifier.verify(AuditScope.PLATFORM, null, null, null);
        assertEquals(AuditChainVerification.Status.TAMPERED, verification.status);
        assertEquals(secondId, verification.brokenAtLogId);
        assertEquals("ENTRY_HASH_MISMATCH", verification.reason);
        assertEquals(2, verification.checkedCount);

        String token = loginPlatformAdmin();
        given().header("Authorization", "Bearer " + token)
            .when().get("/api/v1/platform/audit-logs/verify?scope=PLATFORM")
            .then()
            .statusCode(200)
            .body("code", equalTo(PlatformErrorCode.PLATFORM_AUDIT_CHAIN_TAMPERED))
            .body("data.chain_status", equalTo("TAMPERED"))
            .body("data.broken_at_log_id", equalTo(secondId.toString()));
    }

    @Test
    @DisplayName("TASK-292/TC-BE-26: tạo partition tương lai + retention dọn partition cũ")
    public void testPartitionMaintenance() {
        auditMaintenanceJob.ensureFuturePartitions(3);
        java.time.YearMonth current = java.time.YearMonth.now(java.time.ZoneOffset.UTC);
        List<String> partitions = auditMaintenanceJob.findPartitions();
        for (int i = 0; i < 3; i++) {
            String name = "platform_audit_logs_"
                + current.plusMonths(i).format(java.time.format.DateTimeFormatter.ofPattern("yyyy_MM"));
            org.junit.jupiter.api.Assertions.assertTrue(partitions.contains(name),
                "Missing future partition " + name);
        }
        assertEquals(0, auditMaintenanceJob.ensureFuturePartitions(3));

        QuarkusTransaction.requiringNew().run(() -> entityManager.createNativeQuery(
                "CREATE TABLE IF NOT EXISTS platform_audit_logs_2019_01 "
                    + "PARTITION OF platform_audit_logs FOR VALUES FROM ('2019-01-01 00:00:00+00') "
                    + "TO ('2019-02-01 00:00:00+00')")
            .executeUpdate());
        org.junit.jupiter.api.Assertions.assertTrue(
            auditMaintenanceJob.findPartitions().contains("platform_audit_logs_2019_01"));

        int dropped = auditMaintenanceJob.runRetention(24);
        org.junit.jupiter.api.Assertions.assertTrue(dropped >= 1);
        org.junit.jupiter.api.Assertions.assertFalse(
            auditMaintenanceJob.findPartitions().contains("platform_audit_logs_2019_01"));
    }

    @Test
    @DisplayName("TASK-291: bridge AuditRecorder ghi vào cùng hash chain (bật qua config)")
    public void testAuditRecorderBridge() {
        System.setProperty("openerp.platform.audit.recorder-enabled", "true");
        try {
            com.vn9melody.openerp.core.audit.AuditRecorder.AuditEvent event =
                new com.vn9melody.openerp.core.audit.AuditRecorder.AuditEvent(
                    null, actorUserId, "IAM_PERMISSION_DENIED", "FUNCTIONAL_PERMISSION", null,
                    com.vn9melody.openerp.core.enums.AuditResult.DENIED,
                    Map.of("permission", "core:user:read"), "127.0.0.1");
            auditLogService.record(event);

            assertEquals(1L, PlatformTestSupport.countAudit(entityManager, "IAM_PERMISSION_DENIED"));
            AuditChainVerification verification =
                auditChainVerifier.verify(AuditScope.PLATFORM, null, null, null);
            assertEquals(AuditChainVerification.Status.VERIFIED, verification.status);
        } finally {
            System.clearProperty("openerp.platform.audit.recorder-enabled");
        }
    }

    private String loginPlatformAdmin() {
        String email = PlatformTestSupport.PREFIX + "audit-admin@example.com";
        QuarkusTransaction.requiringNew().run(() -> PlatformTestSupport.createPlatformAdmin(
            email, PlatformAdminRole.SUPER_ADMIN, PlatformAdminStatus.ACTIVE, passwordHashService));
        return given().contentType(ContentType.JSON)
            .body(Map.of("email", email, "password", PlatformTestSupport.PASSWORD))
            .when().post("/api/v1/auth/login")
            .then().statusCode(200).extract().path("data.access_token");
    }
}
