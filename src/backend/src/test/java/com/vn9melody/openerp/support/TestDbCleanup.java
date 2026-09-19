package com.vn9melody.openerp.support;

import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

/**
 * Shared FK-safe cleanup of the {@code openerp_test} database and the test Redis
 * instance. Legacy IAM suites and the Wave 2 platform suites both funnel through
 * this helper so no ordering gaps can leave behind rows that reference
 * {@code users}/{@code tenants} (audit logs, sample records, RBAC links, ...).
 *
 * <p>Every method must be invoked inside an active transaction.
 */
public final class TestDbCleanup {

    private TestDbCleanup() {}

    @Transactional
    public static void cleanup(EntityManager entityManager) {
        @SuppressWarnings("unchecked")
        java.util.List<String> partitions = entityManager.createNativeQuery("""
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
        try {
            entityManager.createNativeQuery("DELETE FROM platform_audit_logs").executeUpdate();
        } finally {
            for (String partition : partitions) {
                entityManager.createNativeQuery(
                    "ALTER TABLE " + partition + " ENABLE TRIGGER USER").executeUpdate();
            }
            entityManager.createNativeQuery(
                    "ALTER TABLE platform_audit_logs ENABLE TRIGGER USER").executeUpdate();
        }

        entityManager.createNativeQuery("DELETE FROM platform_impersonation_logs").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM core_sample_records").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM user_branch_assignments").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM user_department_memberships").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM role_data_policies").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM user_roles").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM departments").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM branches").executeUpdate();
        entityManager.createNativeQuery(
                "DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE tenant_id IS NOT NULL)")
            .executeUpdate();
        entityManager.createNativeQuery("DELETE FROM roles WHERE tenant_id IS NOT NULL").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM platform_super_admins").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM password_reset_tokens").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM user_two_factor").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM user_profiles").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM user_credentials").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM user_tenants").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM users").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM tenants").executeUpdate();
    }

    public static void clearRedis(RedisDataSource redis) {
        var keys = redis.key(String.class);
        for (String pattern : new String[]{"session:*", "user:*:sessions", "impersonation:session:*",
            "blacklist:token:*", "preauth:*", "bruteforce:*", "otp:*", "2fa:*", "health:platform:*"}) {
            var found = keys.keys(pattern);
            if (found != null && !found.isEmpty()) {
                keys.del(found.toArray(new String[0]));
            }
        }
    }
}
