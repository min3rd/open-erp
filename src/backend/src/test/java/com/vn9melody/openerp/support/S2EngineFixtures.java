package com.vn9melody.openerp.support;

import com.vn9melody.openerp.core.enums.DataScope;
import jakarta.persistence.EntityManager;
import java.util.UUID;

/**
 * Native-SQL fixtures for the Wave 2A Data Permission Engine tests.
 * Every row uses the {@code s2eng-} prefix so parallel agents never touch the
 * same data on the shared {@code openerp_test} database.
 */
public final class S2EngineFixtures {

    public static final String PREFIX = "s2eng-";

    private S2EngineFixtures() {}

    public static String suffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    public static UUID insertTenant(EntityManager em, String suffix) {
        UUID id = UUID.randomUUID();
        em.createNativeQuery("INSERT INTO tenants (id, slug, name, type, status) VALUES (?1, ?2, ?3, 'BUSINESS', 'ACTIVE')")
            .setParameter(1, id)
            .setParameter(2, PREFIX + "tenant-" + suffix)
            .setParameter(3, "S2 Engine Tenant " + suffix)
            .executeUpdate();
        return id;
    }

    public static UUID insertUser(EntityManager em, String suffix) {
        UUID id = UUID.randomUUID();
        em.createNativeQuery("INSERT INTO users (id, email, status) VALUES (?1, ?2, 'ACTIVE')")
            .setParameter(1, id)
            .setParameter(2, PREFIX + suffix + "@example.com")
            .executeUpdate();
        return id;
    }

    public static UUID insertUserWithProfile(EntityManager em, String suffix, String fullName) {
        UUID id = insertUser(em, suffix);
        em.createNativeQuery("INSERT INTO user_profiles (user_id, full_name, language, timezone) VALUES (?1, ?2, 'vi', 'Asia/Ho_Chi_Minh')")
            .setParameter(1, id)
            .setParameter(2, fullName)
            .executeUpdate();
        return id;
    }

    public static void insertUserTenant(EntityManager em, UUID userId, UUID tenantId, String role) {
        em.createNativeQuery("INSERT INTO user_tenants (user_id, tenant_id, role) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING")
            .setParameter(1, userId)
            .setParameter(2, tenantId)
            .setParameter(3, role)
            .executeUpdate();
    }

    public static UUID insertCustomRole(EntityManager em, UUID tenantId, String suffix) {
        UUID id = UUID.randomUUID();
        String code = "S2ENG_" + suffix.toUpperCase().replace('-', '_');
        em.createNativeQuery("INSERT INTO roles (id, tenant_id, code, name, is_system) VALUES (?1, ?2, ?3, ?4, FALSE)")
            .setParameter(1, id)
            .setParameter(2, tenantId)
            .setParameter(3, code)
            .setParameter(4, "S2 Engine Role " + suffix)
            .executeUpdate();
        return id;
    }

    public static UUID systemRoleId(EntityManager em, String code) {
        return (UUID) em.createNativeQuery("SELECT id FROM roles WHERE tenant_id IS NULL AND code = ?1")
            .setParameter(1, code)
            .getSingleResult();
    }

    public static void grantPermission(EntityManager em, UUID roleId, String permissionCode) {
        em.createNativeQuery("INSERT INTO role_permissions (role_id, permission_id) "
                + "SELECT ?1, p.id FROM permissions p WHERE p.code = ?2 ON CONFLICT DO NOTHING")
            .setParameter(1, roleId)
            .setParameter(2, permissionCode)
            .executeUpdate();
    }

    public static void assignRole(EntityManager em, UUID userId, UUID tenantId, UUID roleId) {
        em.createNativeQuery("INSERT INTO user_roles (user_id, tenant_id, role_id) VALUES (?1, ?2, ?3) "
                + "ON CONFLICT DO NOTHING")
            .setParameter(1, userId)
            .setParameter(2, tenantId)
            .setParameter(3, roleId)
            .executeUpdate();
    }

    public static void upsertPolicy(EntityManager em, UUID tenantId, UUID roleId, String resource,
                                    DataScope create, DataScope read, DataScope update, DataScope delete,
                                    DataScope export, DataScope share) {
        em.createNativeQuery("INSERT INTO role_data_policies "
                + "(tenant_id, role_id, resource, create_scope, read_scope, update_scope, delete_scope, export_scope, share_scope) "
                + "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) "
                + "ON CONFLICT (role_id, resource) DO UPDATE SET "
                + "create_scope = EXCLUDED.create_scope, read_scope = EXCLUDED.read_scope, "
                + "update_scope = EXCLUDED.update_scope, delete_scope = EXCLUDED.delete_scope, "
                + "export_scope = EXCLUDED.export_scope, share_scope = EXCLUDED.share_scope")
            .setParameter(1, tenantId)
            .setParameter(2, roleId)
            .setParameter(3, resource)
            .setParameter(4, create.name())
            .setParameter(5, read.name())
            .setParameter(6, update.name())
            .setParameter(7, delete.name())
            .setParameter(8, export.name())
            .setParameter(9, share.name())
            .executeUpdate();
    }

    public static UUID insertBranch(EntityManager em, UUID tenantId, String code) {
        UUID id = UUID.randomUUID();
        em.createNativeQuery("INSERT INTO branches (id, tenant_id, code, name) VALUES (?1, ?2, ?3, ?4)")
            .setParameter(1, id)
            .setParameter(2, tenantId)
            .setParameter(3, code)
            .setParameter(4, "Branch " + code)
            .executeUpdate();
        return id;
    }

    public static UUID insertDepartment(EntityManager em, UUID tenantId, UUID branchId, UUID parentId,
                                        String code, UUID managerUserId) {
        UUID id = UUID.randomUUID();
        em.createNativeQuery("INSERT INTO departments (id, tenant_id, branch_id, parent_id, code, name, manager_user_id) "
                + "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)")
            .setParameter(1, id)
            .setParameter(2, tenantId)
            .setParameter(3, branchId)
            .setParameter(4, parentId)
            .setParameter(5, code)
            .setParameter(6, "Department " + code)
            .setParameter(7, managerUserId)
            .executeUpdate();
        return id;
    }

    public static void insertMembership(EntityManager em, UUID userId, UUID tenantId, UUID branchId,
                                        UUID departmentId, boolean primary, UUID directManagerUserId) {
        em.createNativeQuery("INSERT INTO user_department_memberships "
                + "(user_id, tenant_id, branch_id, department_id, is_primary, direct_manager_user_id) "
                + "VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT DO NOTHING")
            .setParameter(1, userId)
            .setParameter(2, tenantId)
            .setParameter(3, branchId)
            .setParameter(4, departmentId)
            .setParameter(5, primary)
            .setParameter(6, directManagerUserId)
            .executeUpdate();
    }

    public static void insertBranchAssignment(EntityManager em, UUID userId, UUID tenantId, UUID branchId,
                                              boolean primary, boolean canManage) {
        em.createNativeQuery("INSERT INTO user_branch_assignments "
                + "(user_id, tenant_id, branch_id, is_primary, can_manage) VALUES (?1, ?2, ?3, ?4, ?5) "
                + "ON CONFLICT DO NOTHING")
            .setParameter(1, userId)
            .setParameter(2, tenantId)
            .setParameter(3, branchId)
            .setParameter(4, primary)
            .setParameter(5, canManage)
            .executeUpdate();
    }

    public static UUID insertSampleRecord(EntityManager em, UUID tenantId, UUID branchId, UUID departmentId,
                                          UUID createdBy, UUID assigneeId, String title, String status) {
        UUID id = UUID.randomUUID();
        em.createNativeQuery("INSERT INTO core_sample_records "
                + "(id, tenant_id, branch_id, department_id, created_by, assignee_id, title, amount, status) "
                + "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 100.00, ?8)")
            .setParameter(1, id)
            .setParameter(2, tenantId)
            .setParameter(3, branchId)
            .setParameter(4, departmentId)
            .setParameter(5, createdBy)
            .setParameter(6, assigneeId)
            .setParameter(7, title)
            .setParameter(8, status)
            .executeUpdate();
        return id;
    }
}
