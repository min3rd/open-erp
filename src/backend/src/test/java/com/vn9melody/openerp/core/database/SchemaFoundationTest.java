package com.vn9melody.openerp.core.database;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import io.quarkus.test.TestTransaction;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Verifies the Sprint 02 foundation on real PostgreSQL: V2.0.0/V2.0.1 schema,
 * permission catalog seed, system role allocation, legacy backfill, audit log
 * partitioning/immutability and cross-tenant integrity constraints.
 */
@QuarkusTest
public class SchemaFoundationTest {

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy_MM");

    private static final Set<String> EXPECTED_PERMISSION_CODES = Set.of(
        "core:user:read", "core:user:create", "core:user:update", "core:user:delete",
        "core:role:read", "core:role:manage", "core:permission:read",
        "core:organization:read", "core:organization:manage",
        "core:branch:read", "core:branch:manage",
        "core:department:read", "core:department:manage",
        "core:membership:read", "core:membership:manage",
        "core:branch-assignment:read", "core:branch-assignment:manage",
        "core:audit:read",
        "core:sample-record:read", "core:sample-record:create", "core:sample-record:update",
        "core:sample-record:delete", "core:sample-record:export", "core:sample-record:share"
    );

    private static final Set<String> SYSTEM_ROLE_CODES = Set.of(
        "TENANT_OWNER", "TENANT_ADMIN", "GENERAL_MANAGER", "STAFF", "VIEWER"
    );

    @Inject
    EntityManager entityManager;

    @Test
    @TestTransaction
    @DisplayName("TASK-275: Flyway V2.0.0 + V2.0.1 Ä‘Ã£ migrate thÃ nh cÃ´ng")
    public void testFlywayMigrationsApplied() {
        long applied = count("SELECT count(*) FROM flyway_schema_history WHERE version IN ('2.0.0', '2.0.1') AND success = true");
        Assertions.assertEquals(2L, applied, "Hai migration V2.0.0/V2.0.1 pháº£i Ä‘Æ°á»£c Ã¡p dá»¥ng thÃ nh cÃ´ng");
    }

    @Test
    @TestTransaction
    @DisplayName("TASK-268: catalog permissions core Ä‘Æ°á»£c seed idempotent, Ä‘á»§ >= 20 mÃ£ cÃ³ description_key i18n")
    public void testPermissionCatalogSeeded() {
        long total = count("SELECT count(*) FROM permissions");
        Assertions.assertTrue(total >= 20, "Catalog pháº£i cÃ³ tá»‘i thiá»ƒu 20 quyá»n, thá»±c táº¿: " + total);

        @SuppressWarnings("unchecked")
        List<String> codes = entityManager.createNativeQuery("SELECT code FROM permissions").getResultList();
        Assertions.assertTrue(codes.containsAll(EXPECTED_PERMISSION_CODES),
            "Thiáº¿u mÃ£ quyá»n core: " + EXPECTED_PERMISSION_CODES.stream().filter(c -> !codes.contains(c)).toList());

        long invalid = count("SELECT count(*) FROM permissions WHERE is_system = false OR description_key IS NULL OR description_key = ''");
        Assertions.assertEquals(0L, invalid, "Má»i permission core pháº£i is_system = true vÃ  cÃ³ description_key");

        long notCore = count("SELECT count(*) FROM permissions WHERE domain <> 'core'");
        Assertions.assertEquals(0L, notCore, "Catalog seed Sprint 02 chá»‰ chá»©a domain core");
    }

    @Test
    @TestTransaction
    @DisplayName("TASK-268: 5 system roles toÃ n cá»¥c + phÃ¢n bá»• role_permissions theo thiáº¿t káº¿")
    public void testSystemRolesAndPermissionAllocation() {
        @SuppressWarnings("unchecked")
        List<Object[]> roles = entityManager.createNativeQuery(
                "SELECT code, is_system, tenant_id FROM roles WHERE tenant_id IS NULL")
            .getResultList();
        Map<String, Object[]> byCode = roles.stream().collect(Collectors.toMap(row -> (String) row[0], row -> row));
        Assertions.assertEquals(5, byCode.size(), "Pháº£i seed Ä‘Ãºng 5 system roles toÃ n cá»¥c");
        Assertions.assertTrue(byCode.keySet().containsAll(SYSTEM_ROLE_CODES), "Thiáº¿u system role: " + byCode.keySet());
        for (String code : SYSTEM_ROLE_CODES) {
            Assertions.assertEquals(true, byCode.get(code)[1], code + " pháº£i is_system = true");
            Assertions.assertNull(byCode.get(code)[2], code + " pháº£i cÃ³ tenant_id NULL (vai trÃ² toÃ n cá»¥c)");
        }

        long totalPermissions = count("SELECT count(*) FROM permissions");
        long readPermissions = count("SELECT count(*) FROM permissions WHERE action = 'read'");
        long readExportPermissions = count("SELECT count(*) FROM permissions WHERE action IN ('read', 'export')");

        Assertions.assertEquals(totalPermissions, rolePermissionCount("TENANT_OWNER"), "TENANT_OWNER pháº£i cÃ³ toÃ n bá»™ quyá»n");
        Assertions.assertEquals(totalPermissions, rolePermissionCount("TENANT_ADMIN"), "TENANT_ADMIN pháº£i cÃ³ toÃ n bá»™ quyá»n");
        Assertions.assertEquals(readExportPermissions, rolePermissionCount("GENERAL_MANAGER"),
            "GENERAL_MANAGER pháº£i cÃ³ toÃ n bá»™ quyá»n read + export (gá»“m audit:read, organization:read)");
        Assertions.assertEquals(readPermissions, rolePermissionCount("VIEWER"), "VIEWER chá»‰ cÃ³ quyá»n read");
        Assertions.assertEquals(4L, rolePermissionCount("STAFF"),
            "STAFF cÃ³ sample-record read/create/update + organization:read");

        long tenantScopedAssignments = count(
            "SELECT count(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id "
                + "WHERE r.tenant_id IS NOT NULL AND r.code IN "
                + "('TENANT_OWNER','TENANT_ADMIN','GENERAL_MANAGER','STAFF','VIEWER')");
        Assertions.assertEquals(0L, tenantScopedAssignments, "Seed Sprint 02 chá»‰ gÃ¡n quyá»n cho system roles");
    }

    @Test
    @TestTransaction
    @DisplayName("TASK-275/BR-RBAC-07: V2.0.1 backfill HQ/GENERAL, membership, branch assignment vÃ  user_roles (idempotent)")
    public void testLegacyBackfillIsIdempotent() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UUID tenantId = insertTenant("legacy-backfill-" + suffix);
        UUID ownerUserId = insertUser("legacy-owner-" + suffix + "@example.com");
        UUID staffUserId = insertUser("legacy-staff-" + suffix + "@example.com");
        insertUserTenant(ownerUserId, tenantId, "OWNER");
        insertUserTenant(staffUserId, tenantId, "MEMBER");

        runBackfillMigration();
        runBackfillMigration();

        Assertions.assertEquals(1L, count(
            "SELECT count(*) FROM branches WHERE tenant_id = ?1 AND code = 'HQ' AND is_default = true", tenantId),
            "Pháº£i táº¡o Ä‘Ãºng 1 branch HQ máº·c Ä‘á»‹nh");
        Assertions.assertEquals(1L, count(
            "SELECT count(*) FROM departments d JOIN branches b ON b.id = d.branch_id "
                + "WHERE d.tenant_id = ?1 AND d.code = 'GENERAL' AND b.code = 'HQ'", tenantId),
            "Department GENERAL pháº£i gáº¯n branch HQ");
        Assertions.assertEquals(2L, count(
            "SELECT count(*) FROM user_department_memberships WHERE tenant_id = ?1 AND is_primary = true", tenantId),
            "Má»i user hiá»‡n há»¯u pháº£i cÃ³ membership primary (HQ/GENERAL)");
        Assertions.assertEquals(2L, count(
            "SELECT count(*) FROM user_branch_assignments WHERE tenant_id = ?1 AND is_primary = true AND can_manage = false", tenantId),
            "Má»i user hiá»‡n há»¯u pháº£i cÃ³ primary branch assignment (khÃ´ng kÃ¨m quyá»n quáº£n lÃ½ chi nhÃ¡nh)");
        Assertions.assertEquals(1L, count(
            "SELECT count(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id "
                + "WHERE ur.user_id = ?1 AND ur.tenant_id = ?2 AND r.code = 'TENANT_OWNER'", ownerUserId, tenantId),
            "OWNER pháº£i Ä‘Æ°á»£c map sang TENANT_OWNER");
        Assertions.assertEquals(1L, count(
            "SELECT count(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id "
                + "WHERE ur.user_id = ?1 AND ur.tenant_id = ?2 AND r.code = 'STAFF'", staffUserId, tenantId),
            "MEMBER pháº£i Ä‘Æ°á»£c map sang STAFF");
        Assertions.assertEquals(2L, count(
            "SELECT count(*) FROM user_tenants WHERE tenant_id = ?1", tenantId),
            "Dá»¯ liá»‡u user_tenants cÅ© pháº£i Ä‘Æ°á»£c giá»¯ nguyÃªn Ä‘á»ƒ rollback");
    }

    @Test
    @TestTransaction
    @DisplayName("TASK-292: partition thÃ¡ng hiá»‡n táº¡i + 2 thÃ¡ng tá»›i + default partition tá»“n táº¡i")
    public void testAuditPartitionsExist() {
        Set<String> partitions = auditPartitionNames();
        Assertions.assertTrue(partitions.contains("platform_audit_logs_default"), "Pháº£i cÃ³ default partition an toÃ n");
        YearMonth current = YearMonth.now(ZoneOffset.UTC);
        for (int i = 0; i <= 2; i++) {
            String expected = "platform_audit_logs_" + current.plusMonths(i).format(MONTH_FORMAT);
            Assertions.assertTrue(partitions.contains(expected), "Thiáº¿u partition " + expected + " (cÃ³: " + partitions + ")");
        }
    }

    @Test
    @TestTransaction
    @DisplayName("TASK-292: báº£n ghi audit Ä‘Æ°á»£c route Ä‘Ãºng partition theo created_at")
    public void testAuditPartitionRouting() {
        UUID tenantId = insertTenant("audit-route-" + UUID.randomUUID().toString().substring(0, 8));
        UUID userId = insertUser("audit-route-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com");
        UUID logId = insertAuditLog(tenantId, userId, "IAM_ROLE_CREATE");

        String partition = (String) entityManager.createNativeQuery(
                "SELECT tableoid::regclass::text FROM platform_audit_logs WHERE id = ?1")
            .setParameter(1, logId)
            .getSingleResult();
        String expectedMonth = YearMonth.now(ZoneOffset.UTC).format(MONTH_FORMAT);
        Assertions.assertEquals("platform_audit_logs_" + expectedMonth, partition,
            "Báº£n ghi pháº£i náº±m trong partition thÃ¡ng hiá»‡n táº¡i (UTC)");
    }

    @Test
    @TestTransaction
    @DisplayName("TASK-291: trigger immutable cháº·n UPDATE báº£n ghi audit")
    public void testAuditUpdateIsBlocked() {
        UUID tenantId = insertTenant("audit-update-" + UUID.randomUUID().toString().substring(0, 8));
        UUID userId = insertUser("audit-update-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com");
        UUID logId = insertAuditLog(tenantId, userId, "IAM_ROLE_CREATE");

        Assertions.assertThrows(Exception.class, () -> entityManager.createNativeQuery(
                "UPDATE platform_audit_logs SET result = 'FAILED' WHERE id = ?1")
            .setParameter(1, logId)
            .executeUpdate(), "UPDATE audit log pháº£i bá»‹ trigger cháº·n");
    }

    @Test
    @TestTransaction
    @DisplayName("TASK-291: trigger immutable cháº·n DELETE báº£n ghi audit")
    public void testAuditDeleteIsBlocked() {
        UUID tenantId = insertTenant("audit-delete-" + UUID.randomUUID().toString().substring(0, 8));
        UUID userId = insertUser("audit-delete-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com");
        UUID logId = insertAuditLog(tenantId, userId, "IAM_ROLE_CREATE");

        Assertions.assertThrows(Exception.class, () -> entityManager.createNativeQuery(
                "DELETE FROM platform_audit_logs WHERE id = ?1")
            .setParameter(1, logId)
            .executeUpdate(), "DELETE audit log pháº£i bá»‹ trigger cháº·n");
    }

    @Test
    @TestTransaction
    @DisplayName("BUG-66: membership khÃ´ng thá»ƒ trá» branch cá»§a tenant khÃ¡c")
    public void testMembershipCrossTenantBranchIsRejected() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UUID tenantA = insertTenant("xtenant-a-" + suffix);
        UUID tenantB = insertTenant("xtenant-b-" + suffix);
        UUID branchA = insertBranch(tenantA, "BR-A-" + suffix);
        UUID departmentA = insertDepartment(tenantA, branchA, "DEPT-A-" + suffix);
        UUID userB = insertUser("xtenant-b-" + suffix + "@example.com");

        Assertions.assertThrows(Exception.class, () -> entityManager.createNativeQuery(
                "INSERT INTO user_department_memberships (user_id, tenant_id, branch_id, department_id, is_primary) "
                    + "VALUES (?1, ?2, ?3, ?4, true)")
            .setParameter(1, userB)
            .setParameter(2, tenantB)
            .setParameter(3, branchA)
            .setParameter(4, departmentA)
            .executeUpdate(), "Composite FK pháº£i cháº·n membership trá» branch/department cá»§a tenant khÃ¡c");
    }

    @Test
    @TestTransaction
    @DisplayName("BUG-66: branch assignment khÃ´ng thá»ƒ trá» branch cá»§a tenant khÃ¡c")
    public void testBranchAssignmentCrossTenantIsRejected() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UUID tenantA = insertTenant("xbranch-a-" + suffix);
        UUID tenantB = insertTenant("xbranch-b-" + suffix);
        UUID branchA = insertBranch(tenantA, "BR-XA-" + suffix);
        UUID userB = insertUser("xbranch-b-" + suffix + "@example.com");

        Assertions.assertThrows(Exception.class, () -> entityManager.createNativeQuery(
                "INSERT INTO user_branch_assignments (user_id, tenant_id, branch_id, is_primary, can_manage) "
                    + "VALUES (?1, ?2, ?3, false, true)")
            .setParameter(1, userB)
            .setParameter(2, tenantB)
            .setParameter(3, branchA)
            .executeUpdate(), "Composite FK pháº£i cháº·n phÃ¢n cÃ´ng branch cá»§a tenant khÃ¡c");
    }

    @Test
    @TestTransaction
    @DisplayName("BUG-66: user_roles khÃ´ng thá»ƒ gÃ¡n role tÃ¹y biáº¿n cá»§a tenant khÃ¡c (system role toÃ n cá»¥c váº«n há»£p lá»‡)")
    public void testUserRoleCrossTenantIsRejected() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UUID tenantA = insertTenant("xrole-a-" + suffix);
        UUID tenantB = insertTenant("xrole-b-" + suffix);
        UUID userB = insertUser("xrole-b-" + suffix + "@example.com");
        UUID roleA = insertRole(tenantA, "CUSTOM_" + suffix.toUpperCase());

        entityManager.createNativeQuery(
                "INSERT INTO user_roles (user_id, tenant_id, role_id) "
                    + "SELECT ?1, ?2, r.id FROM roles r WHERE r.tenant_id IS NULL AND r.code = 'VIEWER'")
            .setParameter(1, userB)
            .setParameter(2, tenantB)
            .executeUpdate();

        Assertions.assertThrows(Exception.class, () -> entityManager.createNativeQuery(
                "INSERT INTO user_roles (user_id, tenant_id, role_id) VALUES (?1, ?2, ?3)")
            .setParameter(1, userB)
            .setParameter(2, tenantB)
            .setParameter(3, roleA)
            .executeUpdate(), "Trigger pháº£i cháº·n gÃ¡n role cá»§a tenant khÃ¡c");
    }

    private long rolePermissionCount(String roleCode) {
        return count("SELECT count(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id "
            + "WHERE r.tenant_id IS NULL AND r.code = ?1", roleCode);
    }

    private long count(String sql, Object... params) {
        var query = entityManager.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) {
            query.setParameter(i + 1, params[i]);
        }
        return ((Number) query.getSingleResult()).longValue();
    }

    @SuppressWarnings("unchecked")
    private Set<String> auditPartitionNames() {
        List<Object> names = entityManager.createNativeQuery(
                "SELECT relname FROM pg_class WHERE relkind = 'r' AND relname LIKE 'platform_audit_logs\\_%' ESCAPE '\\'")
            .getResultList();
        return names.stream()
            .map(name -> (String) name)
            .collect(Collectors.toSet());
    }

    private UUID insertTenant(String slug) {
        UUID id = UUID.randomUUID();
        entityManager.createNativeQuery(
                "INSERT INTO tenants (id, slug, name, type) VALUES (?1, ?2, ?3, 'BUSINESS')")
            .setParameter(1, id)
            .setParameter(2, slug)
            .setParameter(3, "Tenant " + slug)
            .executeUpdate();
        return id;
    }

    private UUID insertUser(String email) {
        UUID id = UUID.randomUUID();
        entityManager.createNativeQuery(
                "INSERT INTO users (id, email, status) VALUES (?1, ?2, 'ACTIVE')")
            .setParameter(1, id)
            .setParameter(2, email)
            .executeUpdate();
        return id;
    }

    private void insertUserTenant(UUID userId, UUID tenantId, String role) {
        entityManager.createNativeQuery(
                "INSERT INTO user_tenants (user_id, tenant_id, role) VALUES (?1, ?2, ?3)")
            .setParameter(1, userId)
            .setParameter(2, tenantId)
            .setParameter(3, role)
            .executeUpdate();
    }

    private UUID insertBranch(UUID tenantId, String code) {
        UUID id = UUID.randomUUID();
        entityManager.createNativeQuery(
                "INSERT INTO branches (id, tenant_id, code, name) VALUES (?1, ?2, ?3, ?4)")
            .setParameter(1, id)
            .setParameter(2, tenantId)
            .setParameter(3, code)
            .setParameter(4, "Branch " + code)
            .executeUpdate();
        return id;
    }

    private UUID insertDepartment(UUID tenantId, UUID branchId, String code) {
        UUID id = UUID.randomUUID();
        entityManager.createNativeQuery(
                "INSERT INTO departments (id, tenant_id, branch_id, code, name) VALUES (?1, ?2, ?3, ?4, ?5)")
            .setParameter(1, id)
            .setParameter(2, tenantId)
            .setParameter(3, branchId)
            .setParameter(4, code)
            .setParameter(5, "Department " + code)
            .executeUpdate();
        return id;
    }

    private UUID insertRole(UUID tenantId, String code) {
        UUID id = UUID.randomUUID();
        entityManager.createNativeQuery(
                "INSERT INTO roles (id, tenant_id, code, name, is_system) VALUES (?1, ?2, ?3, ?4, false)")
            .setParameter(1, id)
            .setParameter(2, tenantId)
            .setParameter(3, code)
            .setParameter(4, "Role " + code)
            .executeUpdate();
        return id;
    }

    private UUID insertAuditLog(UUID tenantId, UUID actorUserId, String action) {
        UUID id = UUID.randomUUID();
        entityManager.createNativeQuery(
                "INSERT INTO platform_audit_logs "
                    + "(id, event_id, scope, tenant_id, actor_user_id, actor_type, actor_email_snapshot, action, result, details, ip_address, entry_hash) "
                    + "VALUES (?1, ?2, 'TENANT', ?3, ?4, 'USER', ?5, ?6, 'SUCCESS', '{}'::jsonb, '127.0.0.1', ?7)")
            .setParameter(1, id)
            .setParameter(2, UUID.randomUUID())
            .setParameter(3, tenantId)
            .setParameter(4, actorUserId)
            .setParameter(5, "actor@example.com")
            .setParameter(6, action)
            .setParameter(7, "0".repeat(64))
            .executeUpdate();
        return id;
    }

    private void runBackfillMigration() {
        String sql = readResource("db/migration/V2.0.1__backfill_existing_tenants.sql");
        for (String statement : sql.split(";")) {
            String cleaned = stripCommentLines(statement);
            if (cleaned.isBlank()) {
                continue;
            }
            entityManager.createNativeQuery(cleaned).executeUpdate();
        }
    }

    private String readResource(String path) {
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(path)) {
            if (in == null) {
                throw new IllegalStateException("KhÃ´ng tÃ¬m tháº¥y migration " + path);
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("KhÃ´ng Ä‘á»c Ä‘Æ°á»£c migration " + path, e);
        }
    }

    private String stripCommentLines(String sql) {
        StringBuilder builder = new StringBuilder();
        for (String line : sql.split("\n")) {
            if (line.trim().startsWith("--")) {
                continue;
            }
            builder.append(line).append('\n');
        }
        return builder.toString().trim();
    }
}

